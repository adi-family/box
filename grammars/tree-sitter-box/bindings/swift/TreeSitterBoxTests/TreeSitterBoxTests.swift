import XCTest
import SwiftTreeSitter
import TreeSitterBox

final class TreeSitterBoxTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_box())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Box grammar")
    }
}
