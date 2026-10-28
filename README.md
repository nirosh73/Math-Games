# Slice Quest

A dependency-free, responsive browser game based on the supplied two-page fraction-shading worksheet. Node.js 22 or newer is required.

## Run on Windows

1. Install the **LTS** version of [Node.js](https://nodejs.org/) using the default Windows installer options.
2. On [the GitHub repository](https://github.com/nirosh73/Math-Games), choose **Code → Download ZIP**.
3. Right-click the downloaded `Math-Games-main.zip` and choose **Extract All**.
4. Open the extracted `Math-Games-main` folder and double-click **Start Slice Quest.cmd**. Keep that window open.
5. Open **http://localhost:3000** in Edge, Chrome, or Firefox.

Results save in the `results` folder beside the launcher. Close the launcher window to stop the game. See `WINDOWS-START-HERE.txt` for troubleshooting.

## Run from a terminal

In the extracted game folder, run:

```sh
npm start
```

The server listens on all interfaces on port 3000 (`PORT` overrides it). Open the server's address in a browser. Devices reaching the same server share the leaderboard. Use `npm test` for the API and exercise-data tests.

Choose a nickname and either the 20 worksheet exercises or eight extra percentage exercises using 100 slices. Tap/click segments, drag to paint, or use the +/− buttons for precision. Keyboard users can focus pieces, shade with Enter/Space, and move with arrow keys. Check the answer to earn points; only a correct answer unlocks the next question. Sound is optional, generated locally, and enabled by the sound button. Reduced-motion settings are respected.

Each correct answer earns 100 points, minus 20 for each preceding wrong attempt, with a minimum of 20. Scores for the two adventure types are labeled separately; their totals differ because they have different numbers of questions. There is no timer or penalty that prevents completion.

## Results and players

The server saves a JSON file when a run starts and after every submitted attempt or progression. Files live in `results/` (ignored by Git), or the directory set by `RESULTS_DIR`. Names have this form:

`PlayerName_2026-10-28T18-00-00-000Z_<unique-run-id>.json`

Each file records the original player name, timestamps, mode, score, question targets and circle subdivisions, every submitted selection, correctness, and total attempts (the length of each question's `attempts` array). A question is wrong on first attempt if `attempts[0].correct` is false. A run remains incomplete until the final correct answer is followed by Finish adventure. Partial runs are preserved too. Download progress during play or the complete results at the end. Interrupted runs can be resumed in the same browser with Continue your saved adventure. Unsubmitted shading is not saved.

Players can take turns on a device or play independently on multiple devices connected to the same server. This is name-based profile entry, not secure authentication or a synchronized competitive room. Use nicknames, not private information. The deployment is intended for a trusted home/classroom network: there is no account protection, administrator authentication, or per-player access control. Anyone with a run ID can read/resume that run. Store the results directory on persistent storage when deploying; restarting Node retains files, replacing its disk does not.

## Worksheet interpretation

Exercises are ordered across each row, then down each page. Page one uses 3 pieces for the first pair and 16 for the rest, preserving equivalent-fraction questions such as 2/32 on 16 pieces. Page two uses 9 pieces for the first six exercises and 21 pieces for the last four (thirds and sevenths). The standalone `1` is treated as one whole. The last target `31/31` also means one whole, independent of the displayed subdivisions. The optional percentage mode adds eight problems whose targets are attainable on 100 equal slices; it introduces the relationship that one slice is 1%.

No external fonts, packages, API keys, or services are needed. The uploaded PDF is not redistributed in this repository.
