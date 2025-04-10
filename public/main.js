const $ = (id) => document.getElementById(id);
const token = () => localStorage.getItem('token');
const email = () => localStorage.getItem('email');

function setUser() {
  $('user-info').innerText = email() ? `👤 ${email()}` : '';
}

$('btn-animals').onclick = async () => {
  const res = await fetch('/animals/api');
  const animals = await res.json();
  $('content').innerHTML = `<h2>입양 동물</h2><div class="grid">` + animals.map(a => `
    <div class="card">
      <img src="${a.image_url}" />
      <h3>${a.name} (${a.gender})</h3>
      <p>${a.breed}</p>
      <p>${a.location}</p>
    </div>
  `).join('') + '</div>';
};

$('btn-board').onclick = async () => {
  const res = await fetch('/articles');
  const { articles } = await res.json();
  let html = '<h2>게시판</h2><ul>' + articles.map(a => `
    <li><strong>${a.title}</strong><p>${a.content}</p></li>
  `).join('') + '</ul>';

  if (token()) {
    html += `
      <h3>글 작성</h3>
      <form id="post-form">
        <input name="title" placeholder="제목" required /><br/>
        <textarea name="content" placeholder="내용" required></textarea><br/>
        <button>작성</button>
      </form>
    `;
  }

  $('content').innerHTML = html;

  if ($('post-form')) {
    $('post-form').onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token()
        },
        body: JSON.stringify({
          title: f.title.value,
          content: f.content.value
        })
      });
      $('btn-board').click();
    };
  }
};

$('btn-login').onclick = () => {
  $('content').innerHTML = `
    <h2>로그인</h2>
    <form id="login-form">
      <input name="email" type="email" required /><br/>
      <input name="password" type="password" required /><br/>
      <button>로그인</button>
    </form>
  `;
  $('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: f.email.value,
        password: f.password.value
      })
    });
    const result = await res.json();
    if (res.ok) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('email', f.email.value);
      setUser();
      $('btn-board').click();
    } else {
      alert(result.message);
    }
  };
};

$('btn-signup').onclick = () => {
  $('content').innerHTML = `
    <h2>회원가입</h2>
    <form id="signup-form">
      <input name="email" type="email" required /><br/>
      <input name="password" type="password" required /><br/>
      <button>회원가입</button>
    </form>
  `;
  $('signup-form').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const res = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: f.email.value,
        password: f.password.value
      })
    });
    if (res.ok) {
      alert('회원가입 완료!');
      $('btn-login').click();
    } else {
      const result = await res.json();
      alert(result.message);
    }
  };
};

setUser();
