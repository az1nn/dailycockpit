package com.dailycockpit.workspace

import android.app.Activity
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResult
import androidx.documentfile.provider.DocumentFile
import app.tauri.annotation.ActivityCallback
import app.tauri.annotation.Command
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

private const val PREFS_NAME = "dailycockpit.android_workspace"
private const val PREF_SOURCE_URI = "source_uri"
private const val MAX_TREE_ENTRIES = 50_000

private data class MaterializedWorkspace(
    val root: String,
    val name: String,
    val sourceUri: String,
    val canWrite: Boolean,
)

@TauriPlugin
class AndroidWorkspacePlugin(private val activity: Activity) : Plugin(activity) {
    private val ioExecutor = Executors.newSingleThreadExecutor()
    private val preferences = activity.getSharedPreferences(PREFS_NAME, Activity.MODE_PRIVATE)

    @Command
    fun pickAndMaterialize(invoke: Invoke) {
        try {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
                addFlags(
                    Intent.FLAG_GRANT_READ_URI_PERMISSION or
                        Intent.FLAG_GRANT_WRITE_URI_PERMISSION or
                        Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION or
                        Intent.FLAG_GRANT_PREFIX_URI_PERMISSION,
                )
            }
            startActivityForResult(invoke, intent, "workspacePickerResult")
        } catch (error: Exception) {
            invoke.reject(error.message ?: "Unable to open Android workspace picker")
        }
    }

    @ActivityCallback
    fun workspacePickerResult(invoke: Invoke, result: ActivityResult) {
        when (result.resultCode) {
            Activity.RESULT_OK -> {
                val data = result.data
                val uri = data?.data
                if (data == null || uri == null) {
                    invoke.reject("Android workspace picker returned no document tree")
                    return
                }

                try {
                    persistPermission(data, uri)
                    preferences.edit().putString(PREF_SOURCE_URI, uri.toString()).apply()
                    materializeAsync(invoke, uri)
                } catch (error: Exception) {
                    invoke.reject(error.message ?: "Unable to persist Android workspace access")
                }
            }

            Activity.RESULT_CANCELED -> invoke.reject("Android workspace picker cancelled")
            else -> invoke.reject("Android workspace picker failed")
        }
    }

    @Command
    fun restoreAndMaterialize(invoke: Invoke) {
        val source = preferences.getString(PREF_SOURCE_URI, null)
        if (source == null) {
            resolveUnavailable(invoke, "not-configured", null)
            return
        }

        val uri = Uri.parse(source)
        val permission = activity.contentResolver.persistedUriPermissions.firstOrNull {
            it.uri == uri && it.isReadPermission
        }
        if (permission == null) {
            resolveUnavailable(invoke, "permission-lost", source)
            return
        }

        val document = DocumentFile.fromTreeUri(activity, uri)
        if (document == null || !document.exists() || !document.canRead()) {
            resolveUnavailable(invoke, "source-missing", source)
            return
        }

        materializeAsync(invoke, uri)
    }

    private fun persistPermission(data: Intent, uri: Uri) {
        val takeFlags = data.flags and
            (Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
        if (takeFlags and Intent.FLAG_GRANT_READ_URI_PERMISSION == 0) {
            throw IllegalStateException("Android workspace selection did not grant read access")
        }
        activity.contentResolver.takePersistableUriPermission(uri, takeFlags)
    }

    private fun materializeAsync(invoke: Invoke, uri: Uri) {
        ioExecutor.execute {
            try {
                val workspace = materialize(uri)
                val response = JSObject().apply {
                    put("available", true)
                    put("root", workspace.root)
                    put("name", workspace.name)
                    put("sourceUri", workspace.sourceUri)
                    put("accessState", "available")
                    put("canWrite", workspace.canWrite)
                }
                activity.runOnUiThread { invoke.resolve(response) }
            } catch (error: Exception) {
                val message = error.message ?: "Unable to materialize Android workspace"
                activity.runOnUiThread { invoke.reject(message) }
            }
        }
    }

    private fun materialize(uri: Uri): MaterializedWorkspace {
        val source = DocumentFile.fromTreeUri(activity, uri)
            ?: throw IllegalStateException("Unable to resolve Android workspace document tree")
        if (!source.exists() || !source.isDirectory || !source.canRead()) {
            throw IllegalStateException("Android workspace source is unavailable")
        }

        val workspaceId = stableWorkspaceId(uri)
        val workspaceRoot = File(activity.filesDir, "workspaces")
        if (!workspaceRoot.exists() && !workspaceRoot.mkdirs()) {
            throw IllegalStateException("Unable to create app-owned workspace directory")
        }

        val target = File(workspaceRoot, workspaceId)
        val staging = File(workspaceRoot, ".$workspaceId-staging-${System.nanoTime()}")
        if (staging.exists()) staging.deleteRecursively()
        if (!staging.mkdirs()) {
            throw IllegalStateException("Unable to create workspace staging directory")
        }

        try {
            val counter = AtomicInteger(0)
            copyTree(source, staging, staging.canonicalFile, counter)
            replaceWorkingCopy(target, staging)
        } catch (error: Exception) {
            staging.deleteRecursively()
            throw error
        }

        return MaterializedWorkspace(
            root = target.canonicalPath,
            name = source.name?.takeIf { it.isNotBlank() } ?: "workspace",
            sourceUri = uri.toString(),
            canWrite = source.canWrite(),
        )
    }

    private fun copyTree(
        source: DocumentFile,
        targetDirectory: File,
        canonicalRoot: File,
        counter: AtomicInteger,
    ) {
        for (child in source.listFiles()) {
            if (counter.incrementAndGet() > MAX_TREE_ENTRIES) {
                throw IllegalStateException("Android workspace exceeds the $MAX_TREE_ENTRIES entry safety limit")
            }

            val name = validatedName(child.name)
            val target = File(targetDirectory, name)
            val canonicalTarget = target.canonicalFile
            val rootPrefix = canonicalRoot.path + File.separator
            if (!canonicalTarget.path.startsWith(rootPrefix)) {
                throw SecurityException("Android workspace entry escaped the app-owned working root")
            }

            when {
                child.isDirectory -> {
                    if (!target.exists() && !target.mkdir()) {
                        throw IllegalStateException("Unable to create workspace directory: $name")
                    }
                    copyTree(child, target, canonicalRoot, counter)
                }

                child.isFile -> {
                    val input = activity.contentResolver.openInputStream(child.uri)
                        ?: throw IllegalStateException("Unable to read workspace document: $name")
                    input.use { sourceStream ->
                        target.outputStream().buffered().use { targetStream ->
                            sourceStream.copyTo(targetStream, DEFAULT_BUFFER_SIZE)
                        }
                    }
                }

                else -> throw IllegalStateException("Unsupported Android document entry: $name")
            }
        }
    }

    private fun replaceWorkingCopy(target: File, staging: File) {
        val backup = File(target.parentFile, ".${target.name}-backup")
        if (backup.exists()) backup.deleteRecursively()

        if (target.exists() && !target.renameTo(backup)) {
            throw IllegalStateException("Unable to rotate previous Android working copy")
        }

        if (!staging.renameTo(target)) {
            if (backup.exists()) backup.renameTo(target)
            throw IllegalStateException("Unable to activate Android working copy")
        }

        if (backup.exists()) backup.deleteRecursively()
    }

    private fun validatedName(value: String?): String {
        val name = value?.takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("Android document entry has no display name")
        if (name == "." || name == ".." || name.contains('/') || name.contains('\\')) {
            throw SecurityException("Android document entry has an unsafe name")
        }
        return name
    }

    private fun stableWorkspaceId(uri: Uri): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(uri.toString().toByteArray(Charsets.UTF_8))
        return bytes.joinToString("") { "%02x".format(it) }.take(24)
    }

    private fun resolveUnavailable(invoke: Invoke, accessState: String, sourceUri: String?) {
        val response = JSObject().apply {
            put("available", false)
            put("root", null)
            put("name", null)
            put("sourceUri", sourceUri)
            put("accessState", accessState)
            put("canWrite", false)
        }
        invoke.resolve(response)
    }
}
