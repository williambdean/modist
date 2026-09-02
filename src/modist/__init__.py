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

__all__ = ["Normal", "Beta", "Gamma", "StudentT", "DistMixin", "ui", "pymc"]

__version__ = "0.3.0"


def __getattr__(name: str):
    """Lazily expose optional-dependency submodules (``ui``, ``pymc``)."""
    if name not in _LAZY_SUBMODULES:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    import importlib  # noqa: PLC0415

    try:
        module = importlib.import_module(f".{name}", __name__)
    except ModuleNotFoundError as e:  # pragma: no cover - depends on env
        raise ModuleNotFoundError(
            f"modist.{name} requires {e.name!r}. Install the extras with "
            f"`pip install 'modist[marimo,pymc]'`."
        ) from e
    globals()[name] = module  # cache so subsequent access avoids re-import
    return module


# Lazily-loaded submodules: `md.ui` and `md.pymc` import heavy/optional deps
# (marimo, pymc) only on first access, so `import modist` stays light.
_LAZY_SUBMODULES = frozenset({"ui", "pymc"})
