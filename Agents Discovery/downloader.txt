import os
import time
from playwright.sync_api import sync_playwright

def download_sap_csv():
    with sync_playwright() as p:
        print("🚀 Starte Browser (Unsichtbarer Headless-Modus)...")
        browser = p.chromium.launch(headless=True) 
        context = browser.new_context(accept_downloads=True)
        page = context.new_page()
        
        # Zeitlimit
        page.set_default_navigation_timeout(90000)
        
        print("🌍 Navigiere zum SAP AI Catalog...")
        try:
            page.goto("https://discovery-center.cloud.sap/ai-catalog/", wait_until="load")
            
            # 1. COOKIE BANNER entfernen
            print("🍪 Entferne Cookie-Layer...")
            try:
                # Wir versuchen den Button zu finden, egal ob er deutsch oder englisch ist
                consent = page.locator("#truste-consent-button, .truste-button-accept")
                if consent.is_visible(timeout=10000):
                    consent.click()
                    print("🖱️ Zustimmen-Button geklickt.")
            except:
                print("ℹ️ Kein Standard-Zustimmungs-Button sichtbar.")

            # JavaScript-Säuberung (entfernt alle blockierenden Overlays)
            page.evaluate("""
                document.querySelectorAll('[id*="trustarc"], [class*="overlay"]').forEach(el => el.remove());
                document.body.style.overflow = 'auto';
            """)
            
            # 2. DER SEITE ZEIT GEBEN
            # SAP braucht oft lange, um die OData-Services im Hintergrund zu laden
            print("⌛ Warte 15 Sekunden, bis die SAP-Tabelle stabil ist...")
            time.sleep(15) 

            # 3. DOWNLOAD-BUTTON FINDEN UND KLICKEN
            print("🔍 Suche Download-Knopf...")
            
            # Wir definieren den Button-Locator
            download_btn = page.locator('button[title="Download"], button[aria-label="Download"]').first
            
            # Scroll den Button sicherheitshalber in die Sichtweite
            download_btn.scroll_into_view_if_needed()
            time.sleep(2)

            print("🖱️ Starte Download-Versuch...")
            with page.expect_download(timeout=90000) as download_info:
                # Wir probieren es erst normal, dann mit Force
                try:
                    download_btn.click(timeout=5000)
                except:
                    print("⚠️ Normaler Klick blockiert, erzwinge Klick...")
                    download_btn.click(force=True)
            
            download = download_info.value
            filename = "sap_ai_raw_data.csv"
            
            # Pfad festlegen
            script_dir = os.path.dirname(os.path.abspath(__file__))
            target_path = os.path.join(script_dir, filename)
            
            download.save_as(target_path)
            print(f"✅ ERFOLG! Datei gespeichert: {target_path}")
            
        except Exception as e:
            print(f"❌ Fehler: {e}")
            # Wir machen ein Beweisfoto, damit wir sehen, was der Browser sieht
            page.screenshot(path="sap_debug_ansicht.png")
            print("📸 Screenshot 'sap_debug_ansicht.png' wurde erstellt.")
        
        print("🚪 Schließe Browser...")
        browser.close()

if __name__ == "__main__":
    download_sap_csv()