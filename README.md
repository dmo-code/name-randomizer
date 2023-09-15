# Name-Randomizer

## Version 0.8.1

Die Anwendung hat die folgenden Hauptfunktionen:

1. **Namen aus einer JSON-Datei laden:** Die Anwendung verwendet den `useEffect`-Hook, um Namen aus einer JSON-Datei ("names.json") zu laden, sobald die Komponente montiert wird. Die geladenen Namen werden im Zustand `names` gespeichert.

2. **Zufällige Namen ziehen:** Wenn der Benutzer auf den "Namen ziehen"-Button klickt (`pickRandomName`-Funktion), wird ein zufälliger Name aus der Liste der verfügbaren Namen ausgewählt und in der Liste der ausgewählten Namen (`selectedNames`) angezeigt. Der ausgewählte Name wird aus der Liste der verfügbaren Namen entfernt.

3. **Namen zurücksetzen:** Der "Namen zurücksetzen"-Button (`handleResetNames`-Funktion) ermöglicht es dem Benutzer, die ausgewählten Namen zurückzusetzen und sie wieder zur Liste der verfügbaren Namen hinzuzufügen.

4. **JSON-Datei bearbeiten und speichern:** Die Anwendung bietet einen Abschnitt zum Bearbeiten und Speichern einer JSON-Datei. Der Benutzer kann den JSON-Inhalt in einem Textfeld bearbeiten. Wenn der "Speichern"-Button geklickt wird (`handleSaveJson`-Funktion), wird der bearbeitete JSON-Inhalt geparst, und die Namen in der Anwendung werden durch die neuen Namen aus der JSON-Datei ersetzt.

5. **Bootstrap-Styling:** Die Anwendung verwendet das Bootstrap CSS-Framework für das Styling von Elementen wie Buttons, Textareas und Überschriften.

6. **Versionshinweis:** Am Ende der Anwendung gibt es einen Versionshinweis.

Diese React-Anwendung ermöglicht es Benutzern, Namen zufällig auszuwählen, sie zurückzusetzen und die Liste der Namen über eine JSON-Datei zu bearbeiten und zu speichern. Sie verwendet React-Hooks wie `useState` und `useEffect`, um den Zustand der Anwendung zu verwalten und asynchrone Daten abzurufen.

## en - Name Randomiser

The "Name Randomiser", allows you to drag random names from a list and display them. Click on "Namen ziehen" (multiple clicks possible 🥳) to select a name. With "Namen zurücksetzen" the selection can be deleted. In the "Bearbeite JSON-Datei" section, the list of names can be adjusted and saved. Simple and straightforward!

The application has the following main functions:

1. **Load names from a JSON file:** The application uses the `useEffect` hook to load names from a JSON file ("names.json") when the component is mounted. The loaded names are stored in the `names` state. 2.

2. **Drag random names:** When the user clicks on the "drag names" button (`pickRandomName` function), a random name is selected from the list of available names and displayed in the list of selected names (`selectedNames`). The selected name is removed from the list of available names. 3.

3. **Reset Names:** The "Reset Names" button (`handleResetNames` function) allows the user to reset the selected names and add them back to the list of available names.

4. **Edit and save JSON file:** The application provides a section for editing and saving a JSON file. The user can edit the JSON content in a text field. When the "Save" button is clicked (`handleSaveJson` function), the edited JSON content is parsed and the names in the application are replaced with the new names from the JSON file.

5. **Bootstrap styling:** The application uses the Bootstrap CSS framework for styling elements such as buttons, textareas and headings.

6. **Version note:** There is a version note at the end of the application.

This React application allows users to

Translated with www.DeepL.com/Translator (free version)
