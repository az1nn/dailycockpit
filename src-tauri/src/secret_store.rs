use std::fmt;

/// Backend-neutral lifecycle exposed by the native SecretStore boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SecretStoreStatus {
    Locked,
    Unlocked,
    Unavailable,
    Corrupt,
}

/// Stable, redacted error categories that product code may react to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SecretStoreErrorCode {
    Locked,
    Unavailable,
    Missing,
    Corrupt,
    InvalidSecretId,
    Backend,
}

/// Error value intentionally carries no backend detail or secret material.
///
/// Backend adapters must map their internal errors into one of these categories
/// before returning across the SecretStore boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SecretStoreError {
    pub code: SecretStoreErrorCode,
}

impl SecretStoreError {
    pub const fn new(code: SecretStoreErrorCode) -> Self {
        Self { code }
    }
}

impl fmt::Display for SecretStoreError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        let message = match self.code {
            SecretStoreErrorCode::Locked => "secret store is locked",
            SecretStoreErrorCode::Unavailable => "secret store is unavailable",
            SecretStoreErrorCode::Missing => "secret is missing",
            SecretStoreErrorCode::Corrupt => "secret store is corrupt",
            SecretStoreErrorCode::InvalidSecretId => "secret identifier is invalid",
            SecretStoreErrorCode::Backend => "secret store backend failed",
        };

        formatter.write_str(message)
    }
}

impl std::error::Error for SecretStoreError {}

/// Opaque logical identifier. It is not a vault path and contains no secret.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SecretId(String);

impl SecretId {
    pub fn new(value: impl Into<String>) -> Result<Self, SecretStoreError> {
        let value = value.into();
        let valid = !value.is_empty()
            && value.len() <= 128
            && value
                .bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'.' | b'_' | b'-'));

        if !valid {
            return Err(SecretStoreError::new(
                SecretStoreErrorCode::InvalidSecretId,
            ));
        }

        Ok(Self(value))
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Secret bytes are deliberately not printable.
///
/// Consumers that truly need the value must call expose(); Debug/Display never
/// reveal it, and the owned buffer is overwritten on drop.
pub struct Secret(Vec<u8>);

impl Secret {
    pub fn new(value: impl Into<Vec<u8>>) -> Self {
        Self(value.into())
    }

    pub fn expose(&self) -> &[u8] {
        &self.0
    }
}

impl fmt::Debug for Secret {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("Secret(<redacted>)")
    }
}

impl fmt::Display for Secret {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("<redacted>")
    }
}

impl Drop for Secret {
    fn drop(&mut self) {
        self.0.fill(0);
    }
}

/// Unlock material is also redacted and zeroed when dropped.
///
/// S002 has not selected whether this represents a user passphrase, an
/// unwrapped random master key, or another platform-specific factor.
pub struct UnlockMaterial(Vec<u8>);

impl UnlockMaterial {
    pub fn new(value: impl Into<Vec<u8>>) -> Self {
        Self(value.into())
    }

    pub fn expose(&self) -> &[u8] {
        &self.0
    }
}

impl fmt::Debug for UnlockMaterial {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("UnlockMaterial(<redacted>)")
    }
}

impl Drop for UnlockMaterial {
    fn drop(&mut self) {
        self.0.fill(0);
    }
}

/// Native capability contract. Product code depends on this trait, never on
/// Stronghold or another backend-specific object.
pub trait SecretStore {
    fn status(&self) -> SecretStoreStatus;
    fn unlock(&mut self, material: &UnlockMaterial) -> Result<(), SecretStoreError>;
    fn lock(&mut self) -> Result<(), SecretStoreError>;
    fn contains(&self, id: &SecretId) -> Result<bool, SecretStoreError>;
    fn read(&self, id: &SecretId) -> Result<Secret, SecretStoreError>;
    fn write(&mut self, id: &SecretId, secret: Secret) -> Result<(), SecretStoreError>;
    fn delete(&mut self, id: &SecretId) -> Result<(), SecretStoreError>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn secret_debug_and_display_are_redacted() {
        let secret = Secret::new(b"canary-super-secret".to_vec());

        let debug = format!("{secret:?}");
        let display = format!("{secret}");

        assert_eq!(debug, "Secret(<redacted>)");
        assert_eq!(display, "<redacted>");
        assert!(!debug.contains("canary-super-secret"));
        assert!(!display.contains("canary-super-secret"));
        assert_eq!(secret.expose(), b"canary-super-secret");
    }

    #[test]
    fn unlock_material_debug_is_redacted() {
        let material = UnlockMaterial::new(b"vault-password".to_vec());
        let debug = format!("{material:?}");

        assert_eq!(debug, "UnlockMaterial(<redacted>)");
        assert!(!debug.contains("vault-password"));
        assert_eq!(material.expose(), b"vault-password");
    }

    #[test]
    fn secret_ids_are_opaque_and_path_like_values_are_rejected() {
        assert!(SecretId::new("provider.openai.primary").is_ok());
        assert!(SecretId::new("github_token-1").is_ok());

        assert_eq!(
            SecretId::new("../vault").unwrap_err().code,
            SecretStoreErrorCode::InvalidSecretId
        );
        assert_eq!(
            SecretId::new("").unwrap_err().code,
            SecretStoreErrorCode::InvalidSecretId
        );
    }

    #[test]
    fn error_messages_are_fixed_and_redacted() {
        let error = SecretStoreError::new(SecretStoreErrorCode::Backend);

        assert_eq!(error.to_string(), "secret store backend failed");
    }
}
