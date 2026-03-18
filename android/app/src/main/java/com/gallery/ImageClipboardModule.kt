package com.gallery

import android.content.ClipData
import android.content.ClipboardManager
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class ImageClipboardModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ImageClipboardModule"

  @ReactMethod
  fun copyImage(path: String, promise: Promise) {
    try {
      val normalizedPath = path.removePrefix("file://")
      val file = File(normalizedPath)

      if (!file.exists()) {
        promise.reject("ENOENT", "Image file does not exist.")
        return
      }

      val uri = FileProvider.getUriForFile(
        reactContext,
        "${reactContext.packageName}.fileprovider",
        file,
      )
      val clipboard =
        reactContext.getSystemService(ClipboardManager::class.java)
          ?: throw IllegalStateException("Clipboard service unavailable.")
      val clip = ClipData.newUri(reactContext.contentResolver, file.name, uri)

      clipboard.setPrimaryClip(clip)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("E_COPY_IMAGE", error.message, error)
    }
  }
}
