import java.net.URI
import java.util.Base64

plugins {
    id("com.android.application")
    // The Flutter Gradle Plugin must be applied after the Android and Kotlin Gradle plugins.
    id("dev.flutter.flutter-gradle-plugin")
}

val uploadStoreFilePath = System.getenv("FUSIONIFY_UPLOAD_STORE_FILE")?.trim().orEmpty()
val uploadStorePassword = System.getenv("FUSIONIFY_UPLOAD_STORE_PASSWORD").orEmpty()
val uploadKeyAlias = System.getenv("FUSIONIFY_UPLOAD_KEY_ALIAS")?.trim().orEmpty()
val uploadKeyPassword = System.getenv("FUSIONIFY_UPLOAD_KEY_PASSWORD").orEmpty()
val releaseTaskRequested =
    gradle.startParameter.taskNames.any { taskName ->
        taskName.contains("release", ignoreCase = true)
    }
val missingSigningVariables =
    mapOf(
        "FUSIONIFY_UPLOAD_STORE_FILE" to uploadStoreFilePath,
        "FUSIONIFY_UPLOAD_STORE_PASSWORD" to uploadStorePassword,
        "FUSIONIFY_UPLOAD_KEY_ALIAS" to uploadKeyAlias,
        "FUSIONIFY_UPLOAD_KEY_PASSWORD" to uploadKeyPassword,
    ).filterValues { it.isEmpty() }.keys
val dartDefines =
    providers.gradleProperty("dart-defines").orNull
        ?.split(',')
        ?.mapNotNull { encoded ->
            runCatching {
                String(Base64.getDecoder().decode(encoded), Charsets.UTF_8)
            }.getOrNull()
        }.orEmpty()
val releaseApiBaseUrl =
    dartDefines
        .firstOrNull { value -> value.startsWith("API_BASE_URL=") }
        ?.substringAfter('=')
        ?.trim()
        .orEmpty()

if (releaseTaskRequested && missingSigningVariables.isNotEmpty()) {
    throw GradleException(
        "Release signing is incomplete. Missing: ${missingSigningVariables.joinToString()}.",
    )
}

if (releaseTaskRequested && !file(uploadStoreFilePath).isFile) {
    throw GradleException("FUSIONIFY_UPLOAD_STORE_FILE must point to an existing upload keystore.")
}

if (releaseTaskRequested) {
    val apiUri = runCatching { URI(releaseApiBaseUrl) }.getOrNull()
    val apiHost = apiUri?.host?.lowercase().orEmpty()
    val localOrReservedHost =
        apiHost == "localhost" ||
            apiHost.endsWith(".localhost") ||
            apiHost == "0.0.0.0" ||
            apiHost == "::1" ||
            apiHost.startsWith("127.") ||
            apiHost == "10.0.2.2" ||
            apiHost.endsWith(".invalid") ||
            apiHost.endsWith(".example") ||
            apiHost.endsWith(".test") ||
            apiHost in setOf("example.com", "example.net", "example.org")
    if (
        releaseApiBaseUrl.isEmpty() ||
        apiUri?.scheme != "https" ||
        apiHost.isEmpty() ||
        apiUri.userInfo != null ||
        apiUri.query != null ||
        apiUri.fragment != null ||
        localOrReservedHost
    ) {
        throw GradleException(
            "Release API_BASE_URL must be an explicit non-local HTTPS URL without credentials, query, or fragment.",
        )
    }
}

android {
    namespace = "id.fusionify.coffee"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "id.fusionify.coffee"
        minSdk = 28
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (missingSigningVariables.isEmpty()) {
            create("release") {
                storeFile = file(uploadStoreFilePath)
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.findByName("release")
        }
    }
}

kotlin {
    compilerOptions {
        jvmTarget = org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17
    }
}

flutter {
    source = "../.."
}
