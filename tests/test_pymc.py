"""Tests for the pm.Model -> Priors helpers (``md.pymc``).

Skip the whole module if marimo or pymc isn't installed. These verify the
root-prior detection, the compiled-input naming, dims shape preservation,
distribution auto-mapping, constant seeding, and the ``draw``/``sample``
evaluation API.
"""

from __future__ import annotations

import numpy as np
import pytest

pytest.importorskip("marimo")
pytest.importorskip("pymc")

import pymc as pm
import pytensor.tensor as pt

import modist as md


def _nested_model():
    """A model with one nested hyperprior, one dims prior, one transformed prior."""
    with pm.Model(
        coords={
            "covariates": ["a", "b", "c"],
            "idx": range(2),
        }
    ) as model:
        intercept_mu = pm.Normal("intercept_mu")
        intercept = pm.Normal("intercept", mu=intercept_mu)
        beta = pm.Normal("beta", dims="covariates")
        sigma = pm.HalfNormal("sigma")
        X = pm.Data("X", np.ones((3, 2)), dims=("covariates", "idx"))
        pm.Normal("obs", mu=intercept + pt.dot(beta.T, X), sigma=sigma, dims="idx")
    return model


def test_lazy_exposure():
    assert md.pymc.__name__ == "modist.pymc"
    assert hasattr(md.pymc, "create_priors")
    assert hasattr(md.pymc, "ModelPriors")
    assert hasattr(md.pymc, "prior_spec")
    assert hasattr(md.pymc, "PriorSpec")


def test_root_priors_detect_nested_only():
    model = _nested_model()
    from modist.pymc import _root_priors

    roots = {rv.name for rv in _root_priors(model)}
    # "intercept" depends on "intercept_mu", so only the leaf is a root.
    assert roots == {"intercept_mu", "beta", "sigma"}


def test_replaced_and_inputs_named_correctly():
    ui = md.pymc.create_priors(_nested_model())
    assert ui.replaced == ["intercept_mu", "beta", "sigma"]
    assert set(ui.inputs) == {
        "intercept_mu_mu",  # nested hyperprior
        "intercept_mu_sigma",
        "beta_a_mu",  # dims prior splits per element (coords a/b/c)
        "beta_a_sigma",
        "beta_b_mu",
        "beta_b_sigma",
        "beta_c_mu",
        "beta_c_sigma",
        "sigma_alpha",
        "sigma_beta",
    }
    assert ui.rv_names == ["intercept_mu", "intercept", "beta", "sigma", "obs"]


def test_value_includes_all_replaced_priors():
    ui = md.pymc.create_priors(_nested_model())
    assert set(ui.value) == {"intercept_mu", "beta", "sigma"}
    # beta is a per-element dims prior -> nested one level deeper
    assert set(ui.value["beta"]) == {"a", "b", "c"}
    assert all(set(v) == {"mu", "sigma"} for v in ui.value["beta"].values())
    assert set(ui.value["beta"]["a"]) == {"mu", "sigma"}
    assert set(ui.value["sigma"]) == {"alpha", "beta"}


def test_draw_preserves_dims_shape_and_returns_all_rvs():
    ui = md.pymc.create_priors(_nested_model())
    draws = ui.draw()
    assert set(draws) == {"intercept_mu", "intercept", "beta", "sigma", "obs"}
    assert np.shape(draws["beta"]) == (3,)  # per-element widgets stacked back up
    assert np.shape(draws["intercept"]) == ()
    assert float(np.min(draws["sigma"])) > 0  # Gamma support stays positive


def test_draw_multiple_and_overrides():
    ui = md.pymc.create_priors(_nested_model())
    stack = ui.draw(n=25)
    assert np.shape(stack["beta"]) == (25, 3)
    assert np.shape(stack["obs"]) == (25, 2)
    # overrides layer on top of current widget values
    single = ui.draw(intercept_mu_sigma=3.0)
    assert np.shape(single["intercept_mu"]) == ()


def _observed_deterministic_model():
    """A model with a dims'd deterministic feeding an observed RV."""
    with pm.Model(coords={"trial": ["a", "b"], "cov": ["x", "y"]}) as model:
        beta = pm.Normal("beta", dims="cov")
        mu = pm.Deterministic("mu", pm.math.ones(2) + beta.sum(), dims="trial")
        pm.Normal("obs", mu=mu, sigma=1.0, observed=np.array([0.0, 0.1]), dims="trial")
    return model


def test_sample_prior_predictive_prior_group_dims_and_coords():
    # _nested_model has no observed RVs -> everything lands in the `prior`
    # group and the `prior_predictive` group stays empty.
    ui = md.pymc.create_priors(_nested_model())
    dt = ui.sample_prior_predictive(n=25)
    prior = dt["prior"].ds
    assert set(prior.data_vars) == {"intercept_mu", "intercept", "beta", "sigma", "obs"}
    assert prior["beta"].dims == ("chain", "draw", "covariates")
    assert prior.sizes["chain"] == 1
    assert prior.sizes["draw"] == 25
    assert prior.coords["covariates"].values.tolist() == ["a", "b", "c"]
    # no observations -> prior_predictive group present but empty
    assert set(dt["prior_predictive"].data_vars) == set()


def test_sample_prior_predictive_observed_and_deterministic():
    ui = md.pymc.create_priors(
        _observed_deterministic_model(), outputs=["beta", "mu", "obs"]
    )
    dt = ui.sample_prior_predictive(n=5)
    prior = dt["prior"].ds
    # deterministic `mu` keeps its dims and coords
    assert set(prior.data_vars) == {"beta", "mu"}
    assert prior["mu"].dims == ("chain", "draw", "trial")
    assert prior.coords["trial"].values.tolist() == ["a", "b"]
    pp = dt["prior_predictive"].ds
    assert set(pp.data_vars) == {"obs"}
    assert pp["obs"].dims == ("chain", "draw", "trial")


def test_sample_prior_predictive_deterministic_included_by_default():
    # match pm.sample_prior_predictive: deterministics are part of the default
    # output set (no `outputs=` needed).
    ui = md.pymc.create_priors(_observed_deterministic_model())
    dt = ui.sample_prior_predictive(n=5)
    prior = dt["prior"].ds
    assert set(prior.data_vars) == {"beta", "mu"}
    assert prior["mu"].dims == ("chain", "draw", "trial")


def test_sample_prior_predictive_default_and_overrides():
    ui = md.pymc.create_priors(_nested_model())
    # default n=500 (matching pm.sample_prior_predictive) -> draw dim size 500
    assert ui.sample_prior_predictive()["prior"].ds.sizes["draw"] == 500
    # overrides pass through to the sampler
    assert (
        ui.sample_prior_predictive(n=3, intercept_mu_sigma=3.0)["prior"].ds.sizes[
            "draw"
        ]
        == 3
    )


def test_mapping_override_and_unknown_family():
    with pm.Model() as model:
        pm.Cauchy("c", alpha=0, beta=1)
    # Cauchy -> StudentT by default (mu/sigma/nu)
    ui = md.pymc.create_priors(model, names=["c"])
    assert set(ui.inputs) == {"c_mu", "c_sigma", "c_nu"}
    # override the registry for this family
    ui2 = md.pymc.create_priors(model, mapping={"Cauchy": md.Beta})
    assert set(ui2.inputs) == {"c_alpha", "c_beta"}


def test_unknown_family_raises():
    with pm.Model() as model:
        pm.Multinomial("m", n=5, p=np.array([0.5, 0.5]))
    with pytest.raises(ValueError, match="no modist family"):
        md.pymc.create_priors(model)


def test_pymc_wrappers_raise_cleanly():
    """Transformed/wrapper distributions (TruncatedNormal, Censored) must not
    silently collapse to the family they wrap (e.g. Normal). They keep their own
    name and raise, so the user opts in via mapping=."""
    with pm.Model() as model:
        pm.TruncatedNormal("t", mu=0, sigma=1, lower=0, upper=2)
    with pytest.raises(ValueError, match="no modist family.*TruncatedNormal"):
        md.pymc.create_priors(model)

    with pm.Model() as model:
        pm.Censored("c", pm.Normal.dist(0, 1), lower=0.0)
    with pytest.raises(ValueError, match="no modist family.*Censored"):
        md.pymc.create_priors(model)


def test_custom_dist_raises_cleanly():
    """A user pm.CustomDist gets its own named op (CustomDist_<rv>) that never
    collides with a registered family, so it raises with an actionable error."""
    def mydist(a, size):
        return pm.Exponential.dist(a, size=size)

    with pm.Model() as model:
        pm.CustomDist("x", 2.0, dist=mydist)
    with pytest.raises(ValueError, match="no modist family.*CustomDist"):
        md.pymc.create_priors(model)


def test_user_subclass_reusing_builtin_op_maps_to_builtin():
    """The RV's *op class* is the ground truth, not the user-facing distribution
    class. A subclass that reuses Normal's rv_op really samples normal, so it
    maps to md.Normal (not an unknown-family error)."""
    class MyNormal(pm.Continuous):
        rv_op = pm.Normal.rv_op

        @classmethod
        def dist(cls, mu=0.0, sigma=1.0, **kwargs):
            return super().dist([mu, sigma], **kwargs)

    with pm.Model() as model:
        MyNormal("x", mu=0, sigma=1)
    ui = md.pymc.create_priors(model)
    assert set(ui.inputs) == {"x_mu", "x_sigma"}


@pytest.mark.parametrize("build,family", [
    pytest.param(
        lambda px: px.Chi("x", nu=3), "Chi",
        id="Chi-customdist-based"),
    pytest.param(
        lambda px: px.GenExtreme("x", mu=0, sigma=1, xi=0.5), "GenExtreme",
        id="GenExtreme-own-RandomVariable"),
    pytest.param(
        lambda px: px.Skellam("x", mu1=2, mu2=1), "Skellam",
        id="Skellam-own-op"),
    pytest.param(
        lambda px: px.DiscreteMarkovChain(
            "x", P=np.eye(2), steps=3, init_dist=pm.Categorical.dist(p=[0.5, 0.5])
        ),
        "DiscreteMarkovChain",
        id="DiscreteMarkovChain-SymbolicRandomVariable"),
])
def test_pymc_extras_distributions_raise_cleanly(build, family):
    """pymc_extras distributions carry their own named op (via class_name or a
    dedicated RV class), so they never leak a wrapped base family into the
    registry. They raise with the true family name, available for mapping=."""
    px = pytest.importorskip("pymc_extras.distributions")
    with pm.Model() as model:
        build(px)
    with pytest.raises(ValueError, match=f"no modist family.*{family}"):
        md.pymc.create_priors(model)


def test_mapping_rescues_extras_distribution():
    """An unsupported extras distribution is usable once mapped to a family."""
    px = pytest.importorskip("pymc_extras.distributions")
    with pm.Model() as model:
        px.Chi("x", nu=3)
    ui = md.pymc.create_priors(model, mapping={"Chi": md.Gamma})
    assert set(ui.inputs) == {"x_alpha", "x_beta"}
    draws = ui.draw(n=3)
    assert np.shape(draws["x"]) == (3,)


def test_lognormal_and_inversegamma_map_out_of_the_box():
    """pymc's RV op class names diverge from its distribution class names for
    Lognormal (LogNormalRV) and InverseGamma (InvGammaRV). The registry is keyed
    by op-derived names, so both resolve to Gamma without a manual mapping=."""
    with pm.Model() as model:
        pm.Lognormal("l", mu=0, sigma=1)
        pm.InverseGamma("ig", alpha=2, beta=1)
    ui = md.pymc.create_priors(model)
    assert set(ui.inputs) == {"l_alpha", "l_beta", "ig_alpha", "ig_beta"}
    draws = ui.draw(n=3)
    assert np.shape(draws["l"]) == (3,)
    assert np.shape(draws["ig"]) == (3,)


def test_mapping_uses_op_derived_names():
    """A ``mapping=`` override is matched against the RV op-derived name, so the
    diverging spellings must be used (LogNormal, not Lognormal)."""
    with pm.Model() as model:
        pm.Lognormal("l", mu=0, sigma=1)
    ui = md.pymc.create_priors(model, mapping={"LogNormal": md.Normal})
    assert set(ui.inputs) == {"l_mu", "l_sigma"}


# Every continuous family the registry intends to cover, keyed by the pymc
# distribution class (the canonical spelling) with constructor args that build
# the RV. The sweep builds each and asserts it resolves without a mapping=.
_REGISTRY_FAMILIES = {
    "Normal": dict(mu=0, sigma=1),
    "StudentT": dict(nu=3),
    "Beta": dict(alpha=2, beta=2),
    "Gamma": dict(alpha=2, beta=1),
    "HalfNormal": dict(sigma=1),
    "Lognormal": dict(mu=0, sigma=1),
    "Exponential": dict(lam=1),
    "HalfStudentT": dict(nu=3),
    "HalfCauchy": dict(beta=1),
    "InverseGamma": dict(alpha=2, beta=1),
    "ChiSquared": dict(nu=3),
    "Wald": dict(mu=1, lam=1),
    "Cauchy": dict(alpha=0, beta=1),
    "Laplace": dict(mu=0, b=1),
    "Logistic": dict(mu=0, s=1),
    "Uniform": dict(lower=0, upper=1),
    "Kumaraswamy": dict(a=1, b=1),
    "Triangular": dict(lower=0, c=0.5, upper=1),
}


@pytest.mark.parametrize("name,args", sorted(_REGISTRY_FAMILIES.items()))
def test_registry_family_resolves_out_of_the_box(name, args):
    """Every family in the registry builds from plain ``pm.<Class>`` and resolves
    via ``prior_spec`` — catching pymc op-class renames (like LogNormal/InvGamma)
    and any registry key that goes unreachable."""
    cls = getattr(pm, name)
    with pm.Model() as model:
        cls("x", **args)
    spec = md.pymc.prior_spec(model)["x"]
    assert spec.family is not None


def test_dist_name_unwraps_core_op():
    """Generic wrapper RV ops (e.g. ``pymc_extras``' ``XRV``) expose the real
    distribution as ``op.core_op``; ``_dist_name`` must unwrap it so priors are
    still identified by their true family instead of the generic name."""
    from types import SimpleNamespace

    from modist.pymc import _dist_name

    with pm.Model() as model:
        real = pm.Beta("real", alpha=2, beta=3)

    # a plain built-in RV has no core_op and is named directly
    assert not hasattr(real.owner.op, "core_op")
    assert _dist_name(real) == "Beta"

    # a wrapped RV (core_op present) is identified by its underlying family
    wrapped = SimpleNamespace(
        owner=SimpleNamespace(op=SimpleNamespace(core_op=real.owner.op))
    )
    assert _dist_name(wrapped) == "Beta"


def test_laplace_maps_to_studentt_by_default():
    with pm.Model() as model:
        pm.Laplace("l", mu=0, b=1)
    # Laplace (symmetric, heavy-tailed) -> StudentT (nu/mu/sigma)
    ui = md.pymc.create_priors(model, names=["l"])
    assert set(ui.inputs) == {"l_nu", "l_mu", "l_sigma"}


def test_is_scalar_size_handles_zero_dim_constants():
    """A "no explicit size" is a 0-D constant (classic ``data=None`` or the
    xtensor ``array(0)`` form). Real sizes are stored 1-D (``[3]``) or are
    symbolic/lazy, and must be treated as a real size."""
    import pytensor.tensor as pt
    from modist.pymc import _is_scalar_size

    assert _is_scalar_size(pt.constant(np.array(0), dtype="int64")) is True
    assert _is_scalar_size(pt.constant(np.array([3]), dtype="int64")) is False

    # real model RVs: no-size scalar True, sized RVs False
    with pm.Model() as model:
        a = pm.Normal("a")
        b = pm.Normal("b", size=3)
    assert _is_scalar_size(model["a"].owner.inputs[1]) is True
    assert _is_scalar_size(model["b"].owner.inputs[1]) is False


def test_names_subset_and_invalid_name():
    model = _nested_model()
    ui = md.pymc.create_priors(model, names=["beta"])
    assert ui.replaced == ["beta"]
    assert set(ui.inputs) == {
        "beta_a_mu",
        "beta_a_sigma",
        "beta_b_mu",
        "beta_b_sigma",
        "beta_c_mu",
        "beta_c_sigma",
    }
    with pytest.raises(ValueError, match="root free-RV"):
        md.pymc.create_priors(model, names=["intercept"])  # not a root


def test_constant_seeding_from_model():
    with pm.Model() as model:
        a = pm.Normal("a", mu=5, sigma=7)
        t = pm.StudentT("t", mu=1, sigma=2, nu=5)
    ui = md.pymc.create_priors(model)
    assert ui["a"].value == {"mu": 5.0, "sigma": 7.0}
    assert ui["t"].value == {"mu": 1.0, "sigma": 2.0, "nu": 5.0}


def test_ui_element_and_update_wiring():
    ui = md.pymc.create_priors(_nested_model())
    assert type(ui).__name__ == "ModelPriors"
    # value aggregation works like md.ui
    before = dict(ui.value)
    ui._update({"sigma": {"alpha": 3.0, "beta": 4.0}})
    assert ui.value["sigma"] == {"alpha": 3.0, "beta": 4.0}
    assert set(ui.value) == set(before)


def _logistic_model():
    """A logistic model with a plain sigmoid expression and a Deterministic."""
    rng = np.random.default_rng(0)
    x = np.linspace(-3, 3, 50)
    y = rng.binomial(1, 1 / (1 + np.exp(-(-0.5 + 1.5 * x))))
    with pm.Model() as model:
        data_x = pm.Data("data_x", x)
        intercept = pm.Normal("intercept")
        slope = pm.Normal("slope")
        p = pm.math.sigmoid(intercept + slope * data_x)
        p_det = pm.Deterministic("p_det", pm.math.sigmoid(intercept + slope * data_x))
        pm.Bernoulli("response", p=p, observed=y)
    return model, p, p_det


def test_outputs_named_rv_default_unchanged():
    model, _, _ = _logistic_model()
    ui = md.pymc.create_priors(model)
    # default = all basic_RVs plus deterministics (matches pm.sample_prior_predictive)
    assert ui.rv_names == ["intercept", "slope", "response", "p_det"]


def test_outputs_deterministic_self_labels():
    model, _, p_det = _logistic_model()
    ui = md.pymc.create_priors(model, outputs=[p_det])
    assert ui.rv_names == ["p_det"]
    draws = ui.draw()
    assert set(draws) == {"p_det"}
    assert all(0 <= v <= 1 for v in np.asarray(draws["p_det"]).ravel())


def test_outputs_plain_expression_label_pair():
    model, p, _ = _logistic_model()
    ui = md.pymc.create_priors(model, outputs=[("p", p)])
    assert ui.rv_names == ["p"]
    draws = ui.draw()
    assert set(draws) == {"p"}
    assert np.shape(draws["p"]) == (50,)
    assert all(0 <= v <= 1 for v in np.asarray(draws["p"]).ravel())


def test_outputs_bare_unnamed_expression_gets_output_i():
    model, p, _ = _logistic_model()
    ui = md.pymc.create_priors(model, outputs=[p])
    assert ui.rv_names == ["output_0"]


def test_outputs_mapping_form():
    model, p, _ = _logistic_model()
    ui = md.pymc.create_priors(model, outputs={"sig": p, "resp": model["response"]})
    assert ui.rv_names == ["sig", "resp"]
    draws = ui.draw(n=3)
    assert np.shape(draws["sig"]) == (3, 50)
    assert np.shape(draws["resp"]) == (3, 50)


def test_outputs_mix_of_forms_and_draw_n():
    model, p, p_det = _logistic_model()
    ui = md.pymc.create_priors(
        model, outputs=["intercept", "p_det", ("sig", p), "response"]
    )
    assert ui.rv_names == ["intercept", "p_det", "sig", "response"]
    draws = ui.draw(n=5)
    assert np.shape(draws["sig"]) == (5, 50)
    assert np.shape(draws["response"]) == (5, 50)
    assert np.shape(draws["intercept"]) == (5,)


# ---------------------------------------------------------------------------
# set_distributions tests
# ---------------------------------------------------------------------------


def test_set_distributions_returns_new_model():
    model = _nested_model()
    ui = md.pymc.create_priors(model)
    new_model = md.pymc.set_distributions(model, ui.value)

    assert new_model is not model
    assert new_model is not ui.model
    assert {r.name for r in new_model.free_RVs} == {r.name for r in model.free_RVs}


def test_set_distributions_changes_family():
    """HalfNormal("sigma") should become GammaRV in the new model."""
    model = _nested_model()
    ui = md.pymc.create_priors(model)
    new_model = md.pymc.set_distributions(model, ui.value)

    op_name = type(new_model["sigma"].owner.op).__name__
    assert op_name == "GammaRV"


def test_set_distributions_hierarchy_preserved():
    """intercept depends on intercept_mu; both are root priors.

    After set_distributions the hierarchy should still hold.
    """
    model = _nested_model()
    ui = md.pymc.create_priors(model)
    new_model = md.pymc.set_distributions(model, ui.value)

    assert type(new_model["intercept_mu"].owner.op).__name__ == "NormalRV"
    assert type(new_model["intercept"].owner.op).__name__ == "NormalRV"
    mu_var = new_model["intercept"].owner.inputs[2]
    intercept_mu_rv = new_model["intercept_mu"]
    # the mu input should be the intercept_mu RV (or a view thereof)
    assert mu_var is intercept_mu_rv or mu_var.owner.inputs[0] is intercept_mu_rv


def test_set_distributions_dims_and_coords_preserved():
    model = _nested_model()
    ui = md.pymc.create_priors(model)
    new_model = md.pymc.set_distributions(model, ui.value)

    assert new_model.coords == {"covariates": ("a", "b", "c"), "idx": (0, 1)}
    beta_op = new_model["beta"].owner.op
    assert "covariates" in [d for d in ("covariates",)]


def test_set_distributions_observed_model_sampled():
    """Observed data, Deterministic, and Potential survive the surgery."""
    rng = np.random.default_rng(1)
    y = rng.normal(1.0, 0.5, size=20)

    with pm.Model() as model:
        intercept = pm.Normal("intercept")
        sigma = pm.HalfNormal("sigma")
        mu = pm.Deterministic("mu", intercept * 1.0)
        pm.Potential("prior_on_scale", pm.math.log(sigma))
        pm.Normal("obs", mu=mu, sigma=sigma, observed=y)

    values = {
        "intercept": {"mu": 2.0, "sigma": 0.25},
        "sigma": {"alpha": 3.0, "beta": 2.0},
    }
    new_model = md.pymc.set_distributions(model, values)

    assert [r.name for r in new_model.free_RVs] == ["intercept", "sigma"]
    assert [r.name for r in new_model.observed_RVs] == ["obs"]
    assert [r.name for r in new_model.deterministics] == ["mu"]
    assert len(new_model.potentials) == 1

    with new_model:
        idata = pm.sample(draws=30, tune=30, chains=1, progressbar=False)
    assert "intercept" in idata.posterior
    assert "mu" in idata.posterior


def test_set_distributions_priors_value_roundtrip():
    """set_distributions(create_priors(model), ui.value) is a no-op family swap."""
    model = _nested_model()
    ui = md.pymc.create_priors(model)
    new_model = md.pymc.set_distributions(model, ui.value)

    draws = ui.draw()
    free_names = {r.name for r in new_model.free_RVs}
    assert set(draws.keys()) == free_names | {"obs"}
    assert np.isfinite(sum(float(np.mean(v)) for v in draws.values() if v.ndim == 0))


def test_set_distributions_validation_unknown_name():
    model = _nested_model()
    with pytest.raises(ValueError, match="root free-RV"):
        md.pymc.set_distributions(model, {"nonsense": {"mu": 0.0}})


def test_set_distributions_validation_wrong_params():
    model = _nested_model()
    with pytest.raises(ValueError, match="parameter keys"):
        md.pymc.set_distributions(model, {"beta": {"alpha": 1.0, "beta": 2.0}})


def test_set_distributions_mapping_override():
    """mapping= lets us replace a distribution not in the default registry."""
    with pm.Model() as model:
        pm.HalfNormal("sigma")

    new_model = md.pymc.set_distributions(
        model,
        {"sigma": {"alpha": 2.0, "beta": 1.0}},
        mapping={"HalfNormal": md.Gamma},
    )
    op_name = type(new_model["sigma"].owner.op).__name__
    assert op_name == "GammaRV"


def test_model_priors_set_distributions_method():
    model = _nested_model()
    ui = md.pymc.create_priors(model)
    new_model = ui.set_distributions()

    assert new_model is not model
    assert {r.name for r in new_model.free_RVs} == {r.name for r in model.free_RVs}
    # sigma family changed
    op_name = type(new_model["sigma"].owner.op).__name__
    assert op_name == "GammaRV"


# ---------------------------------------------------------------------------
# per-element widgets for 1-D dims priors
# ---------------------------------------------------------------------------


def _split_model():
    """A model with a dims prior carrying constant array params."""
    with pm.Model(coords={"covariate": ["a", "b", "c"]}) as model:
        mu = pm.Normal("mu", mu=[1.0, 2.0, 3.0], sigma=1.0, dims="covariate")
        pm.Normal("obs", mu=mu, sigma=1.0)
    return model


def test_split_value_per_element():
    ui = md.pymc.create_priors(_split_model())
    assert ui.value["mu"] == {
        "a": {"mu": 1.0, "sigma": 1.0},
        "b": {"mu": 2.0, "sigma": 1.0},
        "c": {"mu": 3.0, "sigma": 1.0},
    }


def test_split_inputs_named_per_element():
    ui = md.pymc.create_priors(_split_model())
    assert set(ui.inputs) == {
        "mu_a_mu",
        "mu_a_sigma",
        "mu_b_mu",
        "mu_b_sigma",
        "mu_c_mu",
        "mu_c_sigma",
    }


def test_split_draw_shape_and_override():
    ui = md.pymc.create_priors(_split_model())
    draws = ui.draw()
    assert np.shape(draws["mu"]) == (3,)
    # override a single element
    d = ui.draw(mu_b_mu=5.0)
    assert np.shape(d["mu"]) == (3,)


def test_split_set_distributions_vectorizes():
    """Grouped values rebuild vectorized (stacked arrays), not per-element scalars."""
    model = _split_model()
    ui = md.pymc.create_priors(model)
    new_model = md.pymc.set_distributions(model, ui.value)

    rv = new_model["mu"]
    assert type(rv.owner.op).__name__ == "NormalRV"
    # mu/sigma are vector constants stacked from the per-element values
    mu_param = np.asarray(rv.owner.inputs[2].data)
    sigma_param = np.asarray(rv.owner.inputs[3].data)
    assert np.allclose(mu_param, [1.0, 2.0, 3.0])
    assert np.allclose(sigma_param, [1.0, 1.0, 1.0])
    # dims + coords preserved
    assert np.shape(mu_param) == (3,)
    assert new_model.coords == {"covariate": ("a", "b", "c")}


def test_split_set_distributions_samples():
    model = _split_model()
    ui = md.pymc.create_priors(model)
    new_model = md.pymc.set_distributions(model, ui.value)
    with new_model:
        idata = pm.sample(draws=20, tune=20, chains=1, progressbar=False)
    assert "mu" in idata.posterior
    assert np.shape(idata.posterior["mu"].values[0, 0]) == (3,)


def test_split_without_constants_expands_per_element():
    """pm.Normal(\"beta\", dims=\"covariate\") (no constants) still gets one
    widget per element — count from the coord values, seeds from defaults."""
    with pm.Model(coords={"covariate": ["a", "b", "c"]}) as model:
        pm.Normal("beta", dims="covariate")
    ui = md.pymc.create_priors(model)
    assert ui.value["beta"] == {
        "a": {"mu": 0.0, "sigma": 1.0},
        "b": {"mu": 0.0, "sigma": 1.0},
        "c": {"mu": 0.0, "sigma": 1.0},
    }
    assert "beta_a_mu" in ui.inputs
    draws = ui.draw()
    assert np.shape(draws["beta"]) == (3,)


def test_split_remapped_family_expands_per_element_with_defaults():
    """A remapped 1-D family (HalfNormal -> Gamma) still splits per element,
    but takes the family default for every element — the RV's original-op
    params (HalfNormal's sigma) can't seed Gamma's alpha/beta."""
    with pm.Model(coords={"covariate": ["a", "b"]}) as model:
        pm.HalfNormal("h", sigma=2.0, dims="covariate")
    ui = md.pymc.create_priors(model)
    # HalfNormal -> Gamma -> alpha/beta, one widget per element, default seeds
    assert ui.value["h"] == {
        "a": {"alpha": 2.0, "beta": 2.0},
        "b": {"alpha": 2.0, "beta": 2.0},
    }
    assert "h_a_alpha" in ui.inputs
    assert np.shape(ui.draw()["h"]) == (2,)


def test_split_labels_sanitized_from_coords_with_spaces():
    """Coord labels with spaces become identifier-safe tab labels/inputs."""
    with pm.Model(
        coords={"f": ["sunlight hours", "water amount", "soil nitrogen"]}
    ) as m:
        pm.Normal("betas", dims="f")
    ui = md.pymc.create_priors(m)
    assert set(ui.value["betas"]) == {
        "sunlight_hours",
        "water_amount",
        "soil_nitrogen",
    }
    assert "betas_water_amount_mu" in ui.inputs


def test_split_size_without_dims():
    """A constant `size=` (no dims/coords) also expands per element."""
    with pm.Model() as model:
        pm.Normal("b", size=3)
    ui = md.pymc.create_priors(model)
    assert set(ui.value["b"]) == {"0", "1", "2"}
    draws = ui.draw()
    assert np.shape(draws["b"]) == (3,)


def test_split_2d_not_split():
    """2-D dims priors don't expand (single-widget fallback)."""
    with pm.Model(coords={"r": ["x", "y"], "c": ["a", "b"]}) as model:
        pm.Normal("m", mu=np.ones((2, 2)), dims=("r", "c"))
    ui = md.pymc.create_priors(model)
    assert "m_mu" in ui.inputs
    assert ui.value["m"] == {"mu": 0.0, "sigma": 1.0}


def test_set_distributions_mixed_nested_flat():
    """Nested (split) and flat (scalar) values coexist in one call."""
    with pm.Model(coords={"covariate": ["a", "b"]}) as model:
        mu = pm.Normal("mu", mu=[1.0, 2.0], sigma=1.0, dims="covariate")
        sigma = pm.HalfNormal("sigma")
        pm.Normal("obs", mu=mu, sigma=sigma)
    values = {
        "mu": {"a": {"mu": 5.0, "sigma": 1.0}, "b": {"mu": 6.0, "sigma": 1.0}},
        "sigma": {"alpha": 3.0, "beta": 2.0},
    }
    new_model = md.pymc.set_distributions(model, values)
    assert np.allclose(np.asarray(new_model["mu"].owner.inputs[2].data), [5.0, 6.0])
    assert type(new_model["sigma"].owner.op).__name__ == "GammaRV"


def test_set_distributions_grouped_wrong_params():
    model = _split_model()
    with pytest.raises(ValueError, match="parameter keys"):
        md.pymc.set_distributions(
            model,
            {"mu": {"a": {"mu": 1.0}, "b": {"mu": 2.0}, "c": {"mu": 3.0}}},
        )


# ---------------------------------------------------------------------------
# prior_spec + spec round-trip + subset outputs
# ---------------------------------------------------------------------------


def _generative_model():
    """The plant-growth model from the pymc README (coords on both dims)."""
    rng = np.random.default_rng(0)
    x_data = rng.normal(size=(100, 3))
    with pm.Model(
        coords={
            "trial": range(100),
            "features": ["sunlight hours", "water amount", "soil nitrogen"],
        }
    ) as model:
        x = pm.Data("x", x_data, dims=["trial", "features"])
        betas = pm.Normal("betas", dims="features")
        sigma = pm.HalfNormal("sigma")
        pm.Deterministic("mu", x @ betas, dims="trial")
        pm.Normal("plant growth", x @ betas, sigma, dims="trial")
    return model


def test_prior_spec_reports_families_and_labels():
    from modist.pymc import PriorSpec

    spec = md.pymc.prior_spec(_generative_model())
    assert list(spec) == ["betas", "sigma"]
    assert all(isinstance(ps, PriorSpec) for ps in spec.values())

    betas = spec["betas"]
    assert betas.family is md.Normal
    assert betas.split
    assert betas.labels == ["sunlight_hours", "water_amount", "soil_nitrogen"]
    assert betas.params == [
        {"mu": 0.0, "sigma": 1.0},
        {"mu": 0.0, "sigma": 1.0},
        {"mu": 0.0, "sigma": 1.0},
    ]

    sigma = spec["sigma"]
    assert sigma.family is md.Gamma  # HalfNormal -> Gamma
    assert not sigma.split
    assert sigma.params == [{"alpha": 2.0, "beta": 2.0}]


def test_prior_spec_names_subset():
    spec = md.pymc.prior_spec(_generative_model(), names=["sigma"])
    assert list(spec) == ["sigma"]


def test_create_priors_accepts_edited_spec():
    """An edited spec (re-labeled tabs) drives widget building."""
    model = _generative_model()
    spec = md.pymc.prior_spec(model)
    spec["betas"].labels = ["light", "water", "soil"]
    ui = md.pymc.create_priors(model, spec=spec)
    assert set(ui.value["betas"]) == {"light", "water", "soil"}
    assert "betas_light_mu" in ui.inputs
    assert np.shape(ui.draw()["betas"]) == (3,)


def test_create_priors_spec_conflicts_with_names_mapping():
    model = _generative_model()
    spec = md.pymc.prior_spec(model)
    with pytest.raises(ValueError, match="not both"):
        md.pymc.create_priors(model, spec=spec, names=["betas"])
    with pytest.raises(ValueError, match="not both"):
        md.pymc.create_priors(model, spec=spec, mapping={"HalfNormal": md.Beta})


def test_set_distributions_family_roundtrip_faithful():
    """A remapped widget rebuilds as the family shown in the UI (not the
    registry fallback)."""
    with pm.Model() as model:
        pm.HalfNormal("sigma")

    ui = md.pymc.create_priors(model, mapping={"HalfNormal": md.Beta})
    assert ui.value["sigma"] == {"alpha": 2.0, "beta": 2.0}

    new_model = ui.set_distributions()
    assert type(new_model["sigma"].owner.op).__name__ == "BetaRV"


def test_outputs_subset_ignores_unused_priors():
    """outputs=['mu'] works even though sigma doesn't feed mu — the unused
    replacement is skipped and draw() filters sigma's params out."""
    model = _generative_model()
    ui = md.pymc.create_priors(model, outputs=["mu"])
    assert ui.rv_names == ["mu"]
    assert "sis" not in "".join(ui.inputs)  # no sigma wiring
    draws = ui.draw()
    assert set(draws) == {"mu"}
    assert np.shape(draws["mu"]) == (100,)
    # sigma tab still shown (its value isn't forwarded to the sampler)
    assert "sigma" in ui.value


def test_outputs_unknown_name_clear_error():
    # "mu" is a plain Python expression (not a named model variable) here
    with pm.Model() as model:
        x = pm.Data("x", np.ones((5, 2)))
        betas = pm.Normal("betas", dims=None, shape=(2,))
        mu = x @ betas
        pm.Normal("obs", mu=mu, sigma=1.0)
    with pytest.raises(ValueError, match="pm.Deterministic"):
        md.pymc.create_priors(model, outputs=["mu"])
    with pytest.raises(ValueError, match="pm.Deterministic"):
        md.pymc.create_priors(model, outputs=["nonsense"])


def test_draw_unknown_override_raises():
    model = _generative_model()
    ui = md.pymc.create_priors(model)
    with pytest.raises(ValueError, match="unknown input"):
        ui.draw(nonsense_param=1.0)


def test_hand_built_nested_values_vectorize():
    """Hand-built md.ui.create_tabs groups rebuild vectorized alongside
    auto-generated ones."""
    with pm.Model(coords={"site": ["north", "south"]}) as model:
        alpha = pm.Normal("alpha", dims="site")
        pm.Normal("obs", mu=alpha, sigma=1.0)
    panel = md.ui.create_tabs(
        {"alpha": {"north": md.Normal(mu=1.0), "south": md.Normal(mu=2.0)}}
    )
    new_model = md.pymc.set_distributions(model, panel.value)
    mu_param = np.asarray(new_model["alpha"].owner.inputs[2].data)
    assert np.allclose(mu_param, [1.0, 2.0])
    assert new_model.coords == {"site": ("north", "south")}


# --- pymc.dims (xtensor) models ----------------------------------------------
#
# pymc 6's `pymc.dims` API builds RVs as native pytensor.xtensor variables
# (XTensorVariable with an XRV op). These have NO size input slot — the op's
# inputs are just [rng, *params] — and dims are always registered coords. The
# helpers still resolve families (core_op unwrap), split detection, seeding,
# rebuild sizes (from coords, not inputs[1]), and vectorized reconstruction.

def _dims_model():
    import pymc.dims as pmd

    with pm.Model(coords={"channel": ["a", "b"]}) as model:
        sigma = pmd.HalfNormal("sigma", sigma=1.0)
        beta = pmd.Normal(
            "beta",
            mu=pmd.as_xtensor(np.array([0.0, 1.0]), dims="channel"),
            sigma=1.0,
            dims="channel",
        )
    return model


def test_dims_scalar_prior_full_flow():
    """A scalar pymc.dims prior maps, draws, and rebuilds (HalfNormal->Gamma)."""
    pytest.importorskip("pymc.dims")
    model = _dims_model()
    ui = md.pymc.create_priors(model, names=["sigma"])
    assert set(ui.inputs) == {"sigma_alpha", "sigma_beta"}
    draws = ui.draw(n=3)
    assert np.shape(draws["sigma"]) == (3,)
    new_model = md.pymc.set_distributions(model, ui.value)
    assert "sigma" in [r.name for r in new_model.free_RVs]


def test_dims_split_per_element_with_coords():
    """A 1-D pymc.dims prior with registered channel coords splits per element
    with the coord labels, draws (2,), and rebuilds vectorized with dims."""
    pytest.importorskip("pymc.dims")
    model = _dims_model()
    ui = md.pymc.create_priors(model, names=["beta"])
    assert set(ui.inputs) == {"beta_a_mu", "beta_a_sigma", "beta_b_mu", "beta_b_sigma"}
    draws = ui.draw(n=3)
    assert np.shape(draws["beta"]) == (3, 2)
    new_model = md.pymc.set_distributions(model, ui.value)
    assert new_model.named_vars_to_dims["beta"] == ["channel"]
    assert new_model.coords["channel"] == ("a", "b")


def test_dims_array_param_seeds_per_element():
    """XTensorConstant array params seed per-element values (regression: the
    constant check used to see only pt.TensorConstant, so the xtensor mu=[0,1]
    silently fell back to defaults)."""
    pytest.importorskip("pymc.dims")
    model = _dims_model()
    ui = md.pymc.create_priors(model, names=["beta"])
    assert ui.value["beta"] == {
        "a": {"mu": 0.0, "sigma": 1.0},
        "b": {"mu": 1.0, "sigma": 1.0},
    }


def test_dims_multidim_nonsplit():
    """A 2-D pymc.dims prior keeps a single broadcasting widget; its rebuild
    size is derived from the registered coords, not an (absent) size input."""
    pytest.importorskip("pymc.dims")
    import pymc.dims as pmd

    with pm.Model(coords={"a": ["a1", "a2"], "b": ["b1", "b2", "b3"]}) as model:
        pmd.Normal("w", mu=0.0, sigma=1.0, dims=("a", "b"))
    ui = md.pymc.create_priors(model)
    assert "w" in ui.replaced
    draws = ui.draw(n=2)
    assert np.shape(draws["w"]) == (2, 2, 3)
    new_model = md.pymc.set_distributions(model, ui.value)
    assert new_model.named_vars_to_dims["w"] == ["a", "b"]


def test_dims_sample_prior_predictive():
    """sample_prior_predictive on a pymc.dims model returns a DataTree whose
    prior carries model dims/coords."""
    pytest.importorskip("pymc.dims")
    model = _dims_model()
    ui = md.pymc.create_priors(model)
    dt = ui.sample_prior_predictive(n=3)
    assert "beta" in dt.prior.data_vars
    assert dt.prior.beta.dims == ("chain", "draw", "channel")
    assert list(dt.prior.coords["channel"].values) == ["a", "b"]
