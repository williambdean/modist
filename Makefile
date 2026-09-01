.PHONY: js test dev venv jupyter jupyter-kernel

# Build bundled JS (source in js/ -> committed src/modist/static/*.js).
# Requires esbuild: npm install --no-save esbuild
js:
	node build.js

# Launch the Jupyter demo notebook. JUPYTER_PATH surfaces the venv's
# labextensions (anywidget, ipywidgets, jupytext) which the Homebrew
# JupyterLab would otherwise ignore.
jupyter: jupyter-kernel
	JUPYTER_PATH=.venv/share/jupyter uv run jupyter lab demos/jupyter_example.ipynb

# Register this venv as a "modist" Jupyter kernel (idempotent).
jupyter-kernel:
	uv run python -m ipykernel install --prefix=.venv --name modist --display-name "Python 3 (modist)"

# Rebuild JS on every change, for rapid anywidget hot-reload iteration.
js-watch:
	node --watch build.js

test:
	uv run pytest

venv:
	uv venv
	uv pip install -e '.[dev]'
	npm install --no-save esbuild
