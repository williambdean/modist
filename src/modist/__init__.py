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

__all__ = ["Normal", "Beta", "Gamma", "StudentT", "DistMixin"]

__version__ = "0.2.0"
