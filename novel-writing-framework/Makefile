.PHONY: help novel prompt write review compile clean status agents

help:
	@echo "ACF Novel Writing Framework - Commands"
	@echo ""
	@echo "Project Management:"
	@echo "  make novel NAME=my-novel         Create new novel project"
	@echo "  make status NOVEL=my-novel       Show project status"
	@echo ""
	@echo "Writing Workflow:"
	@echo "  make prompt NOVEL=my-novel CH=1  Create author prompt for chapter"
	@echo "  make write NOVEL=my-novel CH=1   Writer creates chapter from prompt"
	@echo "  make review NOVEL=my-novel CH=1  Run full editorial review"
	@echo "  make compile NOVEL=my-novel      Compile accepted chapters into book"
	@echo ""
	@echo "Backlog:"
	@echo "  make backlog                     Show backlog status"
	@echo "  make pending                     List pending tasks"
	@echo "  make accepted                    List accepted chapters"
	@echo ""
	@echo "Utilities:"
	@echo "  make agents                      List available agents"
	@echo "  make clean                       Clean temporary files"
	@echo ""

novel:
	@if [ -z "$(NAME)" ]; then \
		echo "Error: NAME required. Usage: make novel NAME=my-novel"; \
		exit 1; \
	fi
	@mkdir -p novels/$(NAME)/{chapters,characters,worldbuilding,prompts}
	@echo "# $(NAME)" > novels/$(NAME)/outline.md
	@echo "# $(NAME) - Metadata\n\n**Title**: $(NAME)\n**Author**: \n**Genre**: \n**Status**: Draft" > novels/$(NAME)/metadata.md
	@echo "# Prompts Log\n" > novels/$(NAME)/prompts/log.md
	@echo "✓ Novel project '$(NAME)' created in novels/$(NAME)/"

status:
	@if [ -z "$(NOVEL)" ]; then \
		echo "Error: NOVEL required. Usage: make status NOVEL=my-novel"; \
		exit 1; \
	fi
	@echo "=== Status: $(NOVEL) ==="
	@echo ""
	@echo "Chapters:"
	@ls -1 novels/$(NOVEL)/chapters/ 2>/dev/null | wc -l | xargs -I {} echo "  Written: {}"
	@ls -1 .backlog/accepted/ 2>/dev/null | grep -c "chapter" | xargs -I {} echo "  Accepted: {}"
	@echo ""
	@echo "Backlog:"
	@find .backlog/pending/ -name "*.md" 2>/dev/null | wc -l | xargs -I {} echo "  Pending: {}"
	@find .backlog/in-progress/ -name "*.md" 2>/dev/null | wc -l | xargs -I {} echo "  In Progress: {}"
	@find .backlog/in-review/ -name "*.md" 2>/dev/null | wc -l | xargs -I {} echo "  In Review: {}"
	@find .backlog/completed/ -name "*.md" 2>/dev/null | wc -l | xargs -I {} echo "  Completed: {}"

backlog:
	@echo "=== Backlog Status ==="
	@echo ""
	@for state in draft pending in-progress completed in-review feedback revision rejected blocked accepted; do \
		count=$$(find .backlog/$$state/ -name "*.md" 2>/dev/null | wc -l); \
		echo "$$state: $$count"; \
	done

pending:
	@echo "=== Pending Tasks ==="
	@ls -1 .backlog/pending/ 2>/dev/null || echo "  (none)"

accepted:
	@echo "=== Accepted Chapters ==="
	@ls -1 .backlog/accepted/ 2>/dev/null || echo "  (none)"

agents:
	@echo "=== Available Agents ==="
	@echo ""
	@echo "Creative:"
	@echo "  - writer             Creates content from prompts"
	@echo "  - chief-editor       Coordinates review, final decisions"
	@echo ""
	@echo "Editorial:"
	@echo "  - co-editor-character    Character consistency"
	@echo "  - co-editor-plot         Plot continuity"
	@echo ""
	@echo "Experts:"
	@echo "  - expert-light-novels    Light novel stylistics"
	@echo "  - expert-military        Weapons & tactics"
	@echo "  - expert-scifi           Science fiction tech"
	@echo "  - expert-japanese-culture    Japanese culture authenticity"
	@echo ""
	@echo "Production:"
	@echo "  - formatter          Compiles final book"
	@echo ""
	@echo "See docs/agents/ for detailed manifests"

clean:
	@find . -name "*.tmp" -delete
	@find . -name ".DS_Store" -delete
	@echo "✓ Temporary files cleaned"
