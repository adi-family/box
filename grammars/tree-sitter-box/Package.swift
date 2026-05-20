// swift-tools-version:5.3
import PackageDescription

let package = Package(
    name: "TreeSitterBox",
    products: [
        .library(name: "TreeSitterBox", targets: ["TreeSitterBox"]),
    ],
    dependencies: [
        .package(url: "https://github.com/ChimeHQ/SwiftTreeSitter", from: "0.8.0"),
    ],
    targets: [
        .target(
            name: "TreeSitterBox",
            dependencies: [],
            path: ".",
            sources: [
                "src/parser.c",
                // NOTE: if your language has an external scanner, add it here.
            ],
            resources: [
                .copy("queries")
            ],
            publicHeadersPath: "bindings/swift",
            cSettings: [.headerSearchPath("src")]
        ),
        .testTarget(
            name: "TreeSitterBoxTests",
            dependencies: [
                "SwiftTreeSitter",
                "TreeSitterBox",
            ],
            path: "bindings/swift/TreeSitterBoxTests"
        )
    ],
    cLanguageStandard: .c11
)
