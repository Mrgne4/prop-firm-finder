# Mission 7 : parcours étudiant en vrai navigateur (Playwright + Chrome) sur la version de PRODUCTION (sans démos).
# npm run build && npx vite preview --port 4173 &  puis : python3 tests-e2e/browser-check.py
import os, re, sys
os.makedirs("/tmp/pff-shots", exist_ok=True)
from playwright.sync_api import sync_playwright

BASE = "http://localhost:4173/"
OUT = "/tmp/pff-shots"
report, failures = [], []
WARN = "Vérifie les prix, les règles et ton admissibilité directement auprès de l’entreprise avant d’acheter un challenge."

def check(cond, msg):
    if not cond: failures.append(msg)

def overflow(page):
    return page.evaluate("() => ({sw: document.documentElement.scrollWidth, iw: window.innerWidth})")

def nxt(page): page.get_by_role("button", name="Suivant").click()

def count(page):
    return int(page.get_by_test_id("funnel-count").inner_text())

def start(page, markets=("Futures sur indices",), residence="Canada — Québec"):
    page.goto(BASE)
    page.evaluate("() => window.localStorage.clear()")
    page.goto(BASE)
    page.get_by_role("link", name="TROUVER MA PROP FIRM").click()
    for m in markets: page.get_by_role("checkbox", name=re.compile(m)).first.click()
    nxt(page)
    page.get_by_role("radio", name=residence).click(); nxt(page)
    nxt(page)  # instruments : facultatif

def finish(page, budget="Aucun budget défini", steps="Peu importe"):
    page.get_by_role("radio", name=budget).click(); nxt(page)
    page.get_by_role("radio", name=steps).click(); nxt(page)
    page.get_by_role("radio", name="Aucune préférence").first.click(); nxt(page)
    page.get_by_role("radio", name="Aucune préférence particulière").click()
    page.get_by_role("button", name="Voir mes résultats").click()
    page.wait_for_selector("text=VOICI LES PROGRAMMES")

def summary_counts(page):
    t = page.get_by_test_id("results-summary").inner_text()
    m = re.match(r"(\d+) programmes? possibles? .*?(?:(\d+) à confirmer \(budget\) · )?(\d+) alternatives? proches? · (\d+) incompatibles?", t)
    return t, m

with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    for name, vp in [("mobile", {"width": 390, "height": 844}), ("tablet", {"width": 820, "height": 1180}), ("desktop", {"width": 1366, "height": 900})]:
        ctx = b.new_context(viewport=vp, device_scale_factor=1, has_touch=(name != "desktop"), is_mobile=(name == "mobile"))
        page = ctx.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

        # ---- S1 : débutant québécois, futures, budget ≤ 100 $ (préférence) ----
        start(page)
        n_after_residence = count(page)
        check(n_after_residence == 10, f"{name}/S1: 10 programmes futures attendus après marché+résidence, obtenu {n_after_residence}")
        check("Un programme = une offre" in (page.get_by_test_id("funnel").text_content() or ""), f"{name}/S1: unité de comptage absente du bandeau")
        page.get_by_role("radio", name="Day trading").click(); nxt(page)
        page.get_by_role("checkbox", name=re.compile("heures normales")).click()
        page.screenshot(path=f"{OUT}/{name}-1-quiz-when.png")
        nxt(page)
        page.get_by_role("radio", name="Jusqu'à 100 $").click()
        check(page.get_by_role("checkbox", name=re.compile("Indispensable pour moi")).count() == 1, f"{name}/S1: cadenas budget absent")
        check(not page.get_by_role("checkbox", name=re.compile("Indispensable pour moi")).is_checked(), f"{name}/S1: le budget ne doit pas être indispensable par défaut")
        bv = page.get_by_test_id("budget-view").inner_text()
        check("Prix inconnu" in bv and "Prix à vérifier" in bv and "compté une seule fois" in bv, f"{name}/S1: bloc budget incomplet")
        page.screenshot(path=f"{OUT}/{name}-2-quiz-budget.png", full_page=True)
        nxt(page)
        page.get_by_role("radio", name="Peu importe").click(); nxt(page)
        page.get_by_role("radio", name="Aucune préférence").first.click(); nxt(page)
        page.get_by_role("radio", name="Coût total faible").click()
        page.get_by_role("button", name="Voir mes résultats").click()
        page.wait_for_selector("text=VOICI LES PROGRAMMES")
        page.screenshot(path=f"{OUT}/{name}-3-results.png", full_page=True)
        report.append((name, "S1-results", overflow(page)))
        t, m = summary_counts(page)
        check(m is not None, f"{name}/S1: résumé illisible : {t}")
        if m:
            a, c = int(m.group(1)), int(m.group(4))
            check(a + int(m.group(3)) + (int(m.group(2)) if m.group(2) else 0) + c == 28, f"{name}/S1: la somme des catégories n'est pas 28 : {t}")
            nA = page.locator('[data-category="A"] [data-testid^=card-]').count()
            check(nA == a, f"{name}/S1: {nA} cartes en A pour {a} annoncés")
        body = page.inner_text("body")
        for need in ["A. Correspondances potentielles", "B. Alternatives proches", "C. Incompatibles", "Prix à vérifier", WARN, "Pourquoi"]:
            check(need in body, f"{name}/S1: « {need} » absent")
        check("DÉMO" not in body and "Alpha" not in body, f"{name}/S1: démo visible")
        check(not re.search(r"\bCOMPATIBLE\b", body.replace("INCOMPATIBLE", "")), f"{name}/S1: un programme est présenté « COMPATIBLE » sans confirmation")
        # comparaison de deux programmes
        ids = page.eval_on_selector_all("[data-testid^=card-]", "els => els.map(e => e.dataset.testid)")
        for tid in ids[:2]: page.get_by_test_id(tid).get_by_role("button", name="Comparer").click()
        page.locator(".compare-tray a").click(); page.wait_for_selector("table.compare")
        report.append((name, "compare", overflow(page)))

        # ---- S2 : overnight indispensable → 1 programme ; goulot ; passage en « souhaitable » ----
        start(page)
        page.get_by_role("radio", name="Day trading").click(); nxt(page)
        page.get_by_role("checkbox", name=re.compile("conserver mes positions pendant la nuit")).click()
        n = count(page)
        check(n == 1, f"{name}/S2: 1 programme attendu avec overnight, obtenu {n}")
        check("restreint le plus" in page.get_by_test_id("funnel").inner_text(), f"{name}/S2: goulot non nommé")
        page.screenshot(path=f"{OUT}/{name}-4-overnight.png")
        nxt(page)
        finish(page)
        page.screenshot(path=f"{OUT}/{name}-5-overnight-results.png", full_page=True)
        t, m = summary_counts(page)
        check(m is not None and int(m.group(1)) == 1 and int(m.group(3)) == 0, f"{name}/S2: résumé inattendu : {t}")
        check(page.get_by_test_id("strategy").count() == 1, f"{name}/S2: suggestion de changement de stratégie absente")
        check(page.locator('[data-category="B"]').count() == 0, f"{name}/S2: des alternatives B alors que overnight est indispensable")
        check("ne sont pas compatibles" in page.get_by_test_id("strategy").inner_text(), f"{name}/S2: la suggestion n'est pas clairement présentée comme non compatible")
        page.get_by_text("Ajuster mes critères").click()
        page.get_by_role("button", name=re.compile("Indispensable")).first.click()
        page.wait_for_selector('[data-category="B"]')
        t, m = summary_counts(page)
        check(m is not None and int(m.group(3)) == 9, f"{name}/S2: 9 alternatives attendues après passage en souhaitable : {t}")
        check("Ajustement" in page.locator('[data-category="B"]').first.inner_text(), f"{name}/S2: l'ajustement n'est pas nommé")
        report.append((name, "S2-results", overflow(page)))

        # ---- S3 : budget ≤ 50 $ indispensable → « à confirmer » séparé ----
        start(page)
        page.get_by_role("radio", name="Day trading").click(); nxt(page)
        page.get_by_role("checkbox", name=re.compile("Je n'ai pas de préférence")).click(); nxt(page)
        page.get_by_role("radio", name="Jusqu'à 50 $").click()
        page.get_by_role("checkbox", name=re.compile("Indispensable pour moi")).check()
        nxt(page)
        page.get_by_role("radio", name="Peu importe").click(); nxt(page)
        page.get_by_role("radio", name="Aucune préférence").first.click(); nxt(page)
        page.get_by_role("radio", name="Aucune préférence particulière").click()
        page.get_by_role("button", name="Voir mes résultats").click(); page.wait_for_selector("text=VOICI LES PROGRAMMES")
        page.screenshot(path=f"{OUT}/{name}-6-budget-locked.png", full_page=True)
        body = page.inner_text("body")
        check("À confirmer : budget indispensable" in body, f"{name}/S3: groupe « à confirmer » absent")
        check("prix confirmé au-dessus de ton budget" in (page.get_by_test_id("incompatibles").text_content() or "").lower(), f"{name}/S3: C « prix confirmé au-dessus du budget » absent")
        t, m = summary_counts(page)
        check(m is not None and int(m.group(2) or 0) > 0, f"{name}/S3: compteur « à confirmer » absent : {t}")

        # ---- S4 : aucune combinaison ----
        start(page)
        page.get_by_role("radio", name="Day trading").click(); nxt(page)
        for lab in ["heures normales", "conserver mes positions pendant la nuit", "Pendant les annonces"]:
            page.get_by_role("checkbox", name=re.compile(lab)).click()
        nxt(page)
        page.get_by_role("radio", name="Jusqu'à 50 $").click(); nxt(page)
        page.get_by_role("radio", name="Deux étapes").click()
        page.get_by_role("checkbox", name=re.compile("Indispensable pour moi")).check()
        check(count(page) == 0, f"{name}/S4: 0 programme attendu")
        check("Aucun programme ne correspond" in page.get_by_test_id("funnel").inner_text(), f"{name}/S4: message d'absence manquant")
        page.screenshot(path=f"{OUT}/{name}-7-zero.png")
        nxt(page)
        page.get_by_role("radio", name="Aucune préférence").first.click(); nxt(page)
        page.get_by_role("radio", name="Aucune préférence particulière").click()
        page.get_by_role("button", name="Voir mes résultats").click(); page.wait_for_selector("text=VOICI LES PROGRAMMES")
        page.screenshot(path=f"{OUT}/{name}-8-zero-results.png", full_page=True)
        body = page.inner_text("body")
        check("Aucun programme ne remplit tous tes critères" in body, f"{name}/S4: message de résultats vide absent")
        check("Et si tu changeais de stratégie" in body or "Aucune alternative proche non plus" in body, f"{name}/S4: aucune piste proposée")
        report.append((name, "S4-results", overflow(page)))

        # ---- pages annexes ----
        page.goto(BASE + "#/programme/ftmo-1step-standard"); page.wait_for_selector("text=Prix observés sur le site officiel")
        report.append((name, "detail", overflow(page)))
        page.goto(BASE + "#/methode"); 
        page.goto(BASE + "#/explorer"); page.wait_for_selector("text=Explorer toutes")
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
