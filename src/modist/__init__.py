"""modist - interactive distribution widgets for marimo.

Each widget renders a draggable density curve. The synced parameter traits
make ``mo.ui.anywidget(w).value`` a dict that splats directly into a
distribution constructor, e.g. ``pm.Normal.dist(**w.value)``.

Families
--------
- :class:`Normal`      -- ``mu`` / ``sigma``
- :class:`Beta`        -- ``alpha`` / ``beta`` (fixed [0, 1])
- :class:`Gamma`       -- ``alpha`` / ``beta`` (shape / rate, edge at 0)
- :class:`StudentT`    -- ``mu`` / ``sigma`` / ``nu`` (unbounded, heavier tails)
"""

from ._base import DistMixin
from .beta import Beta
from .gamma import Gamma
from .normal import Normal
from .studentt import StudentT

__all__ = ["Normal", "Beta", "Gamma", "StudentT", "DistMixin", "ui"]

__version__ = "0.3.0"


def __getattr__(name: str):
    """Lazily expose the marimo-dependent ``ui`` submodule.

    ``ui`` is imported only on first access so that ``import modist`` never
    requires marimo (the widgets also run in plain Jupyter).
    """
    if name == "ui":
        import importlib  # noqa: PLC0415

        try:
            module = importlib.import_module(".ui", __name__)
        except ModuleNotFoundError as e:  # pragma: no cover - depends on env
            if e.name == "marimo":
                raise ModuleNotFoundError(
                    "modist.ui requires marimo. Install it with "
                    "`pip install 'modist[marimo]'` or `pip install marimo`."
                ) from e
            raise
        globals()[name] = module  # cache so subsequent access avoids re-import
        return module
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
