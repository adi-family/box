GRAMMAR_DIR := ../../grammars/tree-sitter-box

.PHONY: generate commit-grammar copy-queries print-sha

# Regenerate the tree-sitter parser. Run after editing grammar.js.
generate:
	cd $(GRAMMAR_DIR) && npm install --no-audit --no-fund
	cd $(GRAMMAR_DIR) && npx tree-sitter generate

# Commit the regenerated source so Zed can fetch it via the file:// URL
# in extension.toml. Prints the new SHA to paste into extension.toml.
commit-grammar: generate
	cd $(GRAMMAR_DIR) && git add -A && \
	  git -c user.email=box@local -c user.name=box commit -m "regen grammar" --allow-empty -q && \
	  echo "" && echo "New commit SHA (paste into extension.toml [grammars.box]):" && \
	  git rev-parse HEAD

# Copy highlight queries into the language dir Zed reads from.
copy-queries:
	cp $(GRAMMAR_DIR)/queries/highlights.scm languages/box/highlights.scm
	cp $(GRAMMAR_DIR)/queries/brackets.scm   languages/box/brackets.scm
	cp $(GRAMMAR_DIR)/queries/indents.scm    languages/box/indents.scm

print-sha:
	@cd $(GRAMMAR_DIR) && git rev-parse HEAD
