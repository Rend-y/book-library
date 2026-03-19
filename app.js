class BookNode {
    constructor(u, a, t, y, c) { this.udk = u; this.author = a; this.title = t; this.year = +y; this.count = +c; this.left = this.right = null; }
}

class LibraryBST {
    constructor() { this.root = null; }
    add(udk, author, title, year, count) {
        udk = udk.trim();
        if (!udk) throw new Error('Номер УДК не может быть пустым');
        if (!author.trim()) throw new Error('Укажите автора');
        if (!title.trim()) throw new Error('Укажите название');
        if (year < 1000 || year > new Date().getFullYear()) throw new Error('Некорректный год издания');
        if (count < 0) throw new Error('Количество не может быть отрицательным');
        this.root = this._ins(this.root, new BookNode(udk, author.trim(), title.trim(), year, count));
    }
    _ins(n, node) {
        if (!n) return node;
        if (node.udk === n.udk) throw new Error('Книга с УДК «' + node.udk + '» уже существует');
        if (node.udk < n.udk) n.left = this._ins(n.left, node);
        else n.right = this._ins(n.right, node);
        return n;
    }
    remove(udk) {
        udk = udk.trim();
        if (!udk) throw new Error('Введите номер УДК');
        let found = false;
        this.root = this._del(this.root, udk, () => { found = true; });
        if (!found) throw new Error('Книга с УДК «' + udk + '» не найдена');
    }
    _del(n, udk, cb) {
        if (!n) return null;
        if (udk < n.udk) { n.left = this._del(n.left, udk, cb); return n; }
        if (udk > n.udk) { n.right = this._del(n.right, udk, cb); return n; }
        cb();
        if (!n.left) return n.right;
        if (!n.right) return n.left;
        const m = this._min(n.right);
        Object.assign(n, { udk: m.udk, author: m.author, title: m.title, year: m.year, count: m.count });
        n.right = this._del(n.right, m.udk, () => { });
        return n;
    }
    _min(n) { while (n.left) n = n.left; return n; }
    find(udk) { return this._src(this.root, udk.trim()); }
    _src(n, udk) { if (!n) return null; if (udk === n.udk) return n; return udk < n.udk ? this._src(n.left, udk) : this._src(n.right, udk); }
    inorder() { const r = []; this._io(this.root, r); return r; }
    _io(n, r) { if (!n) return; this._io(n.left, r); r.push({ udk: n.udk, author: n.author, title: n.title, year: n.year, count: n.count }); this._io(n.right, r); }
    byYear() { return [...this.inorder()].sort((a, b) => a.year - b.year); }
}

const tree = new LibraryBST();
let currentTab = 'all', highlightUdk = null;

function toast(msg, type = 'info') {
    const el = document.getElementById('toast');
    el.textContent = msg; el.className = 'show ' + type;
    clearTimeout(el._t); el._t = setTimeout(() => { el.className = ''; }, 2800);
}

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function pluralBooks(n) {
    if (n % 10 === 1 && n % 100 !== 11) return n + ' книга';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return n + ' книги';
    return n + ' книг';
}

function render() {
    const books = currentTab === 'year' ? tree.byYear() : tree.inorder();
    const total = books.length;
    const copies = books.reduce((s, b) => s + b.count, 0);
    const years = books.map(b => b.year);
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statCopies').textContent = copies;
    document.getElementById('statOldest').textContent = years.length ? Math.min(...years) : '—';
    document.getElementById('statNewest').textContent = years.length ? Math.max(...years) : '—';
    document.getElementById('countBadge').textContent = pluralBooks(total);
    document.getElementById('sortRow').innerHTML = currentTab === 'year'
        ? 'Сортировка: <span class="sort-badge">по году издания ↑</span>'
        : 'Порядок: <span class="sort-badge">in-order по УДК</span>';
    document.getElementById('panelTitle').textContent = currentTab === 'year' ? 'По году издания' : 'Все книги';
    const grid = document.getElementById('grid');
    if (!books.length) {
        grid.innerHTML = '<div class="empty"><div class="empty-icon">📚</div><p>Каталог пуст.<br>Добавьте книгу или загрузите демо-данные.</p></div>';
        return;
    }
    grid.innerHTML = books.map((b, i) => `
    <div class="book-card ${highlightUdk === b.udk ? 'highlight' : ''}" style="animation-delay:${i * 0.04}s">
      <button class="del-btn" onclick="quickDel('${esc(b.udk)}')" title="Удалить">✕</button>
      <span class="udk-badge">УДК ${esc(b.udk)}</span>
      <div class="title">${esc(b.title)}</div>
      <div class="author">${esc(b.author)}</div>
      <div class="meta">
        <span class="meta-chip"><span class="dot"></span>${b.year} г.</span>
        <span class="meta-chip copies"><span class="dot"></span>${b.count} экз.</span>
      </div>
    </div>`).join('');
}

function switchTab(tab, el) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    render();
}

function addBook() {
    const udk = document.getElementById('fUdk').value;
    const author = document.getElementById('fAuthor').value;
    const title = document.getElementById('fTitle').value;
    const year = +document.getElementById('fYear').value;
    const count = +document.getElementById('fCount').value;
    try {
        tree.add(udk, author, title, year, count);
        ['fUdk', 'fAuthor', 'fTitle', 'fYear', 'fCount'].forEach(id => document.getElementById(id).value = '');
        highlightUdk = udk.trim(); render();
        toast('Книга «' + title + '» добавлена', 'success');
        setTimeout(() => { highlightUdk = null; render(); }, 2000);
    } catch (e) { toast(e.message, 'error'); }
}

function removeBook() {
    const udk = document.getElementById('dUdk').value;
    try {
        tree.remove(udk);
        document.getElementById('dUdk').value = '';
        render(); toast('УДК «' + udk.trim() + '» удалён', 'success');
    } catch (e) { toast(e.message, 'error'); }
}

function quickDel(udk) {
    try { tree.remove(udk); render(); toast('УДК «' + udk + '» удалён', 'success'); }
    catch (e) { toast(e.message, 'error'); }
}

function findBook() {
    const udk = document.getElementById('sUdk').value.trim();
    const res = document.getElementById('searchResult');
    if (!udk) { res.innerHTML = ''; return; }
    const book = tree.find(udk);
    if (book) {
        highlightUdk = udk; render();
        setTimeout(() => {
            const c = document.querySelector('.book-card.highlight');
            if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        res.innerHTML = '<div style="background:rgba(74,103,65,0.08);border:1.5px solid rgba(74,103,65,0.25);border-radius:4px;padding:0.7rem 0.9rem;font-size:0.78rem;font-family:DM Mono,monospace;line-height:1.8;color:var(--ink)">✓ <b>' + esc(book.title) + '</b><br>' + esc(book.author) + ', ' + book.year + ' г., ' + book.count + ' экз.</div>';
        toast('Найдена: «' + book.title + '»', 'success');
        setTimeout(() => { highlightUdk = null; render(); }, 3000);
    } else {
        highlightUdk = null; render();
        res.innerHTML = '<div class="no-match">✗ УДК «' + esc(udk) + '» не найден</div>';
        toast('УДК «' + udk + '» не найден', 'error');
    }
}

function loadDemo() {
    const d = [
        ['519.1', 'Кормен Т.', 'Алгоритмы: построение и анализ', 2001, 2],
        ['004.9', 'Кнут Д.Э.', 'Искусство программирования', 1968, 3],
        ['681.3', 'Страуструп Б.', 'Язык программирования C++', 2011, 4],
        ['001.8', 'Ахо А.', 'Компиляторы: принципы и инструменты', 1986, 1],
        ['330.1', 'Седжвик Р.', 'Алгоритмы на Java', 2003, 2],
        ['510.5', 'Дейкстра Э.', 'Дисциплина программирования', 1978, 1],
        ['004.4', 'Мартин Р.', 'Чистый код', 2008, 3],
        ['681.5', 'Прата С.', 'Язык программирования C', 1993, 2],
    ];
    d.forEach(([u, a, t, y, c]) => { try { tree.add(u, a, t, y, c); } catch (_) { } });
    render(); toast('Демо-данные загружены: 8 книг', 'success');
}

render();
