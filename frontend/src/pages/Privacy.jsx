export default function Privacy() {
  return (
    <section className="page max-w-3xl">
      <h1 className="mb-6 text-[32px] font-semibold">Datenschutzerklärung</h1>

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-[20px] font-semibold">1. Verantwortlicher</h2>
          <p className="text-muted">
            Verantwortlich für die Datenverarbeitung ist:
            <br />
            Couture — Glamouröser Kleiderschrank-Manager
            <br />
            Musterstraße 1, 10115 Berlin, Deutschland
            <br />
            E-Mail: kontakt@couture.example
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">2. Verarbeitete Daten</h2>
          <p className="text-muted">
            Bei der Registrierung verarbeiten wir Ihre E-Mail-Adresse und ein Passwort,
            das ausschließlich als kryptografischer Hash gespeichert wird. Bei der
            Nutzung der Anwendung verarbeiten wir die von Ihnen angelegten
            Garderobenstücke (Name, Kategorie und hochgeladene Bilder) sowie Ihre
            zusammengestellten Outfits.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">3. Zweck und Rechtsgrundlage</h2>
          <p className="text-muted">
            Die Verarbeitung erfolgt ausschließlich zur Bereitstellung des Dienstes
            (Verwaltung Ihrer Garderobe und Outfits). Rechtsgrundlage ist Art. 6 Abs. 1
            lit. b DSGVO (Vertragserfüllung) sowie Ihre Einwilligung nach Art. 6 Abs. 1
            lit. a DSGVO.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">4. Speicherdauer</h2>
          <p className="text-muted">
            Ihre Daten werden gespeichert, solange Ihr Account besteht. Wenn Sie Ihren
            Account löschen, werden alle damit verbundenen Daten (Garderobe, Outfits,
            Bilder) dauerhaft entfernt.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">5. Ihre Rechte</h2>
          <p className="text-muted">
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
            Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung.
            Sie können Ihren Account jederzeit selbst löschen.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">6. Drittanbieter-Ressourcen</h2>
          <p className="text-muted">
            Diese Anwendung lädt keine Schriftarten, Skripte oder sonstige Ressourcen
            von Drittanbietern. Alle verwendeten Ressourcen werden lokal bereitgestellt.
          </p>
        </div>
      </div>
    </section>
  );
}
