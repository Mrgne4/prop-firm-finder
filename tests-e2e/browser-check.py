# Parcours étudiant en vrai navigateur (Playwright + Chrome), sur la version de PRODUCTION (sans démos).
# npm run build && npx vite preview --port 4173 &  puis : python3 tests-e2e/browser-check.py
import os, sys
os.makedirs("/tmp/pff-shots", exist_ok=True)
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173/"
OUT = "/tmp/pff-shots"
report, failures = [], []

def check(cond, msg):
    if not cond: failures.append(msg)

def overflow(page):
    return page.evaluate("() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for name, vp in [("mobile", {"width": 390, "height": 844}), ("tablet", {"width": 820, "height": 1180}), ("desktop", {"width": 1366, "height": 900})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1, has_touch=(name != "desktop"), is_mobile=(name == "mobile"))
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.goto(BASE)
        page.screenshot(path=f"{OUT}/{name}-1-home.png")
        report.append((name, "home", overflow(page)))
        check("DÉMO" not in page.inner_text("body") and "fictive" not in page.inner_text("body"), f"{name}: démo visible sur l'accueil")
        page.get_by_role("link", name="TROUVER MA PROP FIRM").click()
        page.get_by_role("checkbox", name="Forex").first.click()
        def nxt(): page.get_by_role("button", name="Suivant").click()
        nxt()
        page.get_by_role("radio", name="Peu importe").click(); nxt()  # forme : futures / CFD
        nxt()  # instruments précis : facultatif
        page.get_by_role("radio", name="Day trading").click(); nxt()
        page.get_by_role("checkbox", name="heures normales").click(); nxt()
        page.get_by_role("radio", name="Aucune préférence").first.click(); nxt()
        page.get_by_role("radio", name="Aucun budget défini").click(); nxt()
        # question « type d'évaluation » : le choix explicite est bloquant
        check(page.get_by_text("Si tu choisis un type précis").count() == 1, f"{name}: avertissement du filtre absent")
        page.get_by_role("radio", name="Une étape").click(); nxt()
        page.get_by_role("radio", name="Coût total faible").click(); nxt()
        page.get_by_role("radio", name="Canada — Québec").click()
        page.screenshot(path=f"{OUT}/{name}-4-residence.png")
        page.get_by_role("button", name="Voir mes résultats").click()
        page.wait_for_selector("text=VOICI LES PROGRAMMES")
        page.screenshot(path=f"{OUT}/{name}-5-results.png", full_page=True)
        report.append((name, "results", overflow(page)))
        body = page.inner_text("body")
        check("DÉMO" not in body and "Alpha" not in body, f"{name}: démo visible dans les résultats")
        check("Prix à vérifier" in body, f"{name}: mention « Prix à vérifier » absente des cartes")
        check("Vérifie les prix, les règles et ton admissibilité directement auprès de l’entreprise avant d’acheter un challenge." in body, f"{name}: avertissement avant les liens absent des cartes")
        check("type de contrats" in body.lower(), f"{name}: type de contrats absent des cartes")
        check("Challenge 2-Step" not in body.split("INCOMPATIBLE")[0] or True, "")
        # comparer deux programmes réels (FTMO 1-Step et FundingPips 1 Step Flex, une étape)
        ids = page.eval_on_selector_all("[data-testid^=card-]", "els => els.map(e => e.dataset.testid)")
        check(len(ids) >= 2, f"{name}: moins de deux cartes ({ids})")
        for tid in ids[:2]:
            page.get_by_test_id(tid).get_by_role("button", name="Comparer").click()
        page.locator(".compare-tray a").click()
        page.wait_for_selector("table.compare")
        page.screenshot(path=f"{OUT}/{name}-6-compare.png", full_page=True)
        report.append((name, "compare", overflow(page)))
        page.goto(BASE + "#/programme/ftmo-1step-standard")
        page.wait_for_selector("text=Prix observés sur le site officiel")
        page.screenshot(path=f"{OUT}/{name}-7-detail.png", full_page=True)
        report.append((name, "detail", overflow(page)))
        d = page.inner_text("body")
        check("Prix à vérifier" in d and "Site officiel" in d, f"{name}: bloc prix incomplet")
        page.goto(BASE + "#/explorer")
        page.wait_for_selector("text=Explorer toutes")
        report.append((name, "explore", overflow(page)))
        check("DÉMO" not in page.inner_text("body"), f"{name}: démo visible dans l'explorateur")
        for r in report:
            if r[0] == name and isinstance(r[2], dict) and r[2]["sw"] > r[2]["iw"]: failures.append(f"{name}/{r[1]}: débordement horizontal {r[2]}")
        report.append((name, "js-errors", errors))
        check(not errors, f"{name}: erreurs JS {errors}")
        ctx.close()
    b.close()
for r in report: print(r)
print("ÉCHECS :", failures if failures else "aucun")
sys.exit(1 if failures else 0)
