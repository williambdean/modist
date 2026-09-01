.PHONY: js test dev venv

# Build bundled JS (source in js/ -> committed src/modist/static/*.js).
# Requires esbuild: npm install --no-save esbuild
js:
	node build.js

# Rebuild JS on every change, for rapid anywidget hot-reload iteration.
js-watch:
	node --watch build.js

test:
	uv run pytest

venv:
	uv venv
	uv pip install -e '.[dev]'
	npm install --no-save esbuild
