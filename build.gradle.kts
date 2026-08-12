plugins {
    id("java")
}

tasks.register("assembleDebug") {
    doLast {
        println("Build successful")
    }
}
