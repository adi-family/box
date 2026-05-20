package tree_sitter_box_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_box "github.com/tree-sitter/tree-sitter-box/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_box.Language())
	if language == nil {
		t.Errorf("Error loading Box grammar")
	}
}
