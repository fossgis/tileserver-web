# https://tile.openstreetmap.de/

## Voraussetzungen

Dieses Projekt erfordert NodeJS und NPM. Node und NPM sind sehr einfach zu installieren. Um sicherzustellen, dass sie auf dem Rechner verfügbar sind, führt man den folgenden Befehl aus.

$ npm -v && node -v
9.6.4
v18.14.2

## Installation

Zunächst klont man dieses Repo auf seinen lokalen Rechner und wechselt in das Verzeichnis:

```
$ git clone https://gitlab.fossgis.de/osm-server/tileserver-web.git
$ cd tileserver-web
```

Um die Bibliothek zu installieren und einzurichten, ruft man folgenden Befehl aus:

```
$ npm install
```

## Verwendung

### Entwickeln der Anwendung

Per `npm start` kann auf eine Entwicklungsversion via `http://localhost:8080/` zugegriffen werden. Diese enthält Variablen, die später auf dem Produktionsserver per Ansible ausgetauscht werden.

```
$ npm start
```


### Erstellen einer Distributionsversion

```
$ npm run build
```

Dieser Task erstellt die Distributionsversion des Projekts im lokalen `src/dist/` Ordner.

### Bereitstellen der Distributionsversion

```
$ npm run serve
```

Damit wird die bereits erzeugte Distributionsversion des Projekts via `http://localhost:4173/` veröffentlicht.
