"""Interactive Kumaraswamy distribution widget on the fixed [0, 1] domain.

``a`` and ``b`` are the two shape parameters (pymc's spelling —
``pm.Kumaraswamy.dist(**w.value)`` works directly; the ``alpha``/``beta``
aliases common in jStat and other ecosystems resolve through the distparams
registry). Drag the mean line to translate or the ``q25`` / ``q75`` squares to
reshape.

scipy has no Kumaraswamy distribution, so :attr:`scipy` raises
``NotImplementedError``; use :attr:`pymc` or build directly from the params.

Examples
--------
>>> import marimo as mo
>>> import modist as md
>>> w = mo.ui.anywidget(md.Kumaraswamy(a=2, b=2))
>>> w
>>> params = w.value  # {'a': ..., 'b': ...}
"""

from __future__ import annotations

from pathlib import Path

import anywidget
import traitlets

from ._base import DistMixin

_ESM = Path(__file__).parent / "static" / "kumaraswamy.js"
_CSS = Path(__file__).parent / "styles.css"


class Kumaraswamy(DistMixin, anywidget.AnyWidget):
    """An interactive Kumaraswamy distribution with draggable shapes and mean."""

    _esm = _ESM
    _css = _CSS
    _param_names = ("a", "b")
    _dist_name = "Kumaraswamy"
    _registry_key = "kumaraswamy"
    # pymc's KumaraswamyRV op-input order (verified): (a, b)
    _op_param_order = ("a", "b")

    a = traitlets.Float(2.0).tag(sync=True)
    b = traitlets.Float(2.0).tag(sync=True)

    def _make_scipy(self, stats):
        raise NotImplementedError(
            "scipy has no Kumaraswamy distribution; use .pymc or the widget's params."
        )