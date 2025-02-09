import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [names, setNames] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [jsonContent, setJsonContent] = useState('');
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const response = await fetch('names.json');
        const data = await response.json();
        setNames(data.names);
        setJsonContent(JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('Fehler beim Laden der Namen: ', error);
      }
    };

    fetchNames();
  }, []);

  const pickRandomName = () => {
    if (names.length === 0) {
      alert('Alle Namen wurden bereits gezogen.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * names.length);
    const randomName = names[randomIndex];

    setNames(names.filter((name, index) => index !== randomIndex));
    setSelectedNames([...selectedNames, randomName]);
  };

  const handleResetNames = () => {
    setNames([...names, ...selectedNames]);
    setSelectedNames([]);
  };

  const handleSaveJson = () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      setNames(parsedJson.names);
      setSelectedNames([]);
    } catch (error) {
      console.error('Fehler beim Parsen des JSON-Inhalts: ', error);
    }
  };

  return (
    <div className="container mt-5 mb-5">
      <h1>Namen-Randomizer</h1>
      <p>Der <strong>"Namen-Randomizer"</strong>, erlaubt es, zufällige Namen aus einer Liste zu ziehen und anzuzeigen. Klicke auf "Namen ziehen" (mehrfach klick möglich 🥳), um einen Namen auszuwählen. Mit "Namen zurücksetzen" kann die Auswahl gelöscht werden. Im Abschnitt "Bearbeite JSON-Datei" kann die Namensliste angepasst und gespeichert werden. Einfach und unkompliziert!</p>
      <p>en - The <strong>"Name Randomiser"</strong>, allows you to drag random names from a list and display them. Click on "Namen ziehen" (multiple clicks possible 🥳) to select a name. With "Namen zurücksetzen" the selection can be deleted. In the "Bearbeite JSON-Datei" section, the list of names can be adjusted and saved. Simple and straightforward!</p>
      <div className="mt-5">
        <button className="btn btn-primary me-2" onClick={pickRandomName}>
          Namen ziehen
        </button>
        {selectedNames.map((name, index) => (
          <p className="mt-3" key={index}><strong>Name {index + 1}:</strong> {name}</p>
        ))}
      </div>
      <div className="mt-3">
      <button className="btn btn-danger me-2" onClick={handleResetNames}>
          Namen zurücksetzen
        </button>
      </div>
      <hr className="mt-5"></hr>
      <div className="mt-5">
        <h2>
          <button
            className={`btn btn-light ${isAccordionOpen ? 'collapsed' : ''}`}
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#jsonAccordion"
            aria-expanded={isAccordionOpen}
          >
            Bearbeite JSON-Datei
          </button>
        </h2>
        <div className={`collapse ${isAccordionOpen ? 'show' : ''}`} id="jsonAccordion">
          <textarea
            rows="20"
            className="form-control"
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
          />
          <button className="btn btn-primary mt-2" onClick={handleSaveJson}>
            Speichern
          </button>
        </div>
      </div>
      <div className="text-end blockquote-footer"><p><small>Namen-Randomizer - Version 0.8.1</small></p></div>
    </div>
  );
}

export default App;
