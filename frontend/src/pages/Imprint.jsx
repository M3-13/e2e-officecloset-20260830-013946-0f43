export default function Imprint() {
  return (
    <section className="page max-w-3xl">
      <h1 className="mb-6 text-[32px] font-semibold">Impressum</h1>

      <div className="space-y-6">
        <div>
          <h2 className="mb-2 text-[20px] font-semibold">Angaben gemäß § 5 DDG</h2>
          <p className="text-muted">
            Couture — Glamouröser Kleiderschrank-Manager
            <br />
            Musterstraße 1<br />
            10115 Berlin
            <br />
            Deutschland
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">Kontakt</h2>
          <p className="text-muted">
            E-Mail: kontakt@couture.example
            <br />
            Telefon: +49 (0)30 000000
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">Vertretungsberechtigt</h2>
          <p className="text-muted">Max Mustermann</p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">Haftung für Inhalte</h2>
          <p className="text-muted">
            Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet,
            übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
            Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-[20px] font-semibold">Urheberrecht</h2>
          <p className="text-muted">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
            unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
            Verbreitung und jede Art der Verwertung außerhalb der Grenzen des
            Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors.
          </p>
        </div>
      </div>
    </section>
  );
}
