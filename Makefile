.PHONY: js test dev venv jupyter

# Build bundled JS (source in js/ -> committed src/modist/static/*.js).
# Requires esbuild: npm install --no-save esbuild
js:
	node build.js

# Launch the Jupyter demo notebook. JUPYTER_PATH surfaces the venv's
# labextensions (anywidget, ipywidgets, jupytext) which the Homebrew
# JupyterLab would otherwise ignore.
jupyter:
	JUPYTER_PATH=.venv/share/jupyter uv run jupyter lab demos/jupyter_example.ipynb

# Rebuild JS on every change, for rapid anywidget hot-reload iteration.
js-watch:
	node --watch build.js

test:
	uv run pytest

venv:
	uv venv
	uv pip install -e '.[dev]'
	npm install --no-save esbuild
