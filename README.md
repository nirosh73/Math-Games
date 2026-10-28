# Slice Quest

A dependency-free, responsive browser game inspired by the supplied fraction-shading worksheet, with new randomized questions on every run. Node.js 22 or newer is required.

## Run on Windows

1. Install the **LTS** version of [Node.js](https://nodejs.org/) using the default Windows installer options.
2. On [the GitHub repository](https://github.com/nirosh73/Math-Games), choose **Code → Download ZIP**.
3. Right-click the downloaded `Math-Games-main.zip` and choose **Extract All**.
4. Open the extracted `Math-Games-main` folder and double-click **Start Slice Quest.cmd**. Keep that window open.
5. Open **http://localhost:3000** in Edge, Chrome, or Firefox.

Results save in the `results` folder beside the launcher. Close the launcher window to stop the game. See `WINDOWS-START-HERE.txt` for troubleshooting.

To update an existing copy, stop the old launcher, download and extract a fresh ZIP into a new folder, and copy the old `results` folder into the new game folder to retain player history. Start the new launcher and press **Ctrl+F5** in the browser. Start a new adventure to get the new generated questions; resuming retains the existing question set.

## Run from a terminal

In the extracted game folder, run:

```sh
npm start
```

The server listens on all interfaces on port 3000 (`PORT` overrides it). Open the server's address in a browser. Devices reaching the same server share the leaderboard. Use `npm test` for the API and exercise-data tests.

Choose a nickname and either 20 freshly generated fraction exercises or eight random percentage exercises using 100 slices. Tap/click segments, drag to paint, or use the +/− buttons for precision. Keyboard users can focus pieces, shade with Enter/Space, and move with arrow keys. Check the answer to earn points; after checking, a worked explanation appears to the right (below the circle on phones). It simplifies the target when needed, divides the circle into equal groups, and multiplies to find the number of slices. Wrong answers reveal the teaching steps and keep the circle editable. A correct answer celebrates, locks the answer, and unlocks **Continue adventure** so the learner can read at their own pace. On phones the explanation scrolls into view after the celebration. The final correct answer unlocks **See the Hall of Fame**. Every target and shaded selection shows its percentage; repeating decimals are rounded to two decimal places and marked with ≈. Sound is optional, generated locally, and enabled by the sound button. Reduced-motion settings are respected.

Each correct answer earns 100 points, minus 20 for each preceding wrong attempt, with a minimum of 20. Scores for the two adventure types are labeled separately; their totals differ because they have different numbers of questions. There is no timer or penalty that prevents completion.

## Results and players

The server saves a JSON file when a run starts and after every submitted attempt or progression. Files live in `results/` (ignored by Git), or the directory set by `RESULTS_DIR`. Names have this form:

`PlayerName_2026-10-28T18-00-00-000Z_<unique-run-id>.json`

Each file records the original player name, timestamps, mode, score, question targets and circle subdivisions, every submitted selection, correctness, target percentages, shaded percentages per attempt, and total attempts (the length of each question's `attempts` array). A question is wrong on first attempt if `attempts[0].correct` is false. A run completes when the player clicks See the Hall of Fame after the final correct answer. If continuing fails, the answer stays saved and Continue offers a retry. Partial runs are preserved too. Download progress during play or the complete results at the end. Interrupted runs can be resumed in the same browser with Continue your saved adventure. Unsubmitted shading is not saved.

Players can take turns on a device or play independently on multiple devices connected to the same server. This is name-based profile entry, not secure authentication or a synchronized competitive room. Use nicknames, not private information. The deployment is intended for a trusted home/classroom network: there is no account protection, administrator authentication, or per-player access control. Anyone with a run ID can read/resume that run. Store the results directory on persistent storage when deploying; restarting Node retains files, replacing its disk does not.

## Fresh questions

Starting an adventure generates and saves a new randomized question set. Foundations has 20 questions, progressing from small denominators to finer circles and equivalent fractions. Each target fraction appears at most once per run, including equivalent forms of that fraction. The 100-slice challenge selects eight distinct random targets from 1% through 99%, displayed as simplified fractions. Questions can recur across separate runs; each run gets a newly generated set rather than a fixed worksheet or shuffled copy.

The exact generated questions are saved with the run, so resuming never changes them. Older saved worksheet runs also remain playable. Score rules and result filenames are unchanged. Respecting a device’s reduced-motion preference stops monster movement and celebration animations.

No external fonts, packages, API keys, or services are needed. The uploaded PDF is not redistributed in this repository.

## Monster buddies and Hall of Fame

A violet and a peach monster wander in a dedicated meadow above the game. They pause to study with hands on hips, cheer when an answer is correct, and react gently to a wrong attempt. Another buddy helps explain the answer in the thinking nook. All artwork is original inline SVG, and the game works offline after setup.

The Hall of Fame appears on the home and finish screens. It lists every nickname’s best completed score, with separate boards for Fraction foundations and the 100-slice challenge so different round lengths are not compared. It also shows first-try solves and completed adventure counts. Repeated nicknames are grouped without case sensitivity; this is name-based play, not authenticated identity. Incomplete runs are preserved in results but do not enter the Hall of Fame.
