# Lunch Order

A small static website for the school lunch rotation. Plain HTML, CSS and JavaScript, with two JSON files as the "database". No build step, no server code.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `app.js` | Student page: today's order and a preview of tomorrow's |
| `history.html`, `history.js` | Past days: "Yesterday" button and a date picker |
| `admin.html`, `admin.js` | Your tool: completes the day and creates the two updated JSON files |
| `common.js` | Shared code: the rotation rule, date handling, drawing the orders |
| `style.css` | All the styling |
| `data/current.json` | The order for the current day |
| `data/history.json` | Every completed day |

Students only ever read the JSON files. Only you change them.

## Publish on GitHub Pages (once)

1. Create a GitHub repository and push this folder to it.
2. In the repository open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://USERNAME.github.io/REPOSITORY/`. Put that address in the QR code.

## Every day

1. Open `admin.html`.
2. Click **Complete Today & Create Tomorrow** and confirm.
3. Click **Download both JSON files**.
4. Move the two files into the `data` folder, replacing the old ones.
5. In the project folder run:

   ```bash
   git add .
   git commit -m "Update lunch order"
   git push
   ```

GitHub Pages updates the public site a minute or two later.

## Opening the admin page

Browsers block a page opened straight from disk (`file://`) from reading other files. If you open `admin.html` that way, it shows a box where you choose `current.json` and `history.json` by hand. Everything else works the same.

If you prefer it to load the files automatically, run this in the project folder and open <http://localhost:8000/admin.html>:

```bash
python3 -m http.server
```

You can also open `admin.html` on the live GitHub Pages address. It cannot change anything there; it only prepares files to download.

## Things you may want to change

All in the top of `common.js`:

- `GROUPS`: the group titles.
- `CLASS_SIZES`: students per class (only used for the group totals).
- `SCHOOL_DAYS`: which weekdays have lunch. "Tomorrow" skips the others. The default is Monday to Friday.

To change the starting order, edit `data/current.json` by hand.
