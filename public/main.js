document.addEventListener('DOMContentLoaded', () => {
  // 단축 선택 함수, 로컬스토리지 관련 함수
  const $ = id => document.getElementById(id);
  const token = () => localStorage.getItem('token');
  const currentUserEmail = () => localStorage.getItem('email');

  console.log("main.js loaded, DOMContentLoaded 이벤트 발생");

  /*=========================
     JWT 디코딩 및 사용자 정보 설정
  ==========================*/
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return {};
    }
  }
  
  function setUser() {
    const emailVal = currentUserEmail();
    const userInfo = $('user-info');
    const logoutBtn = $('logout-btn');
    if (emailVal && token()) {
      const decoded = parseJwt(token());
      // 관리자이면 '관리자 (이메일)', 아니면 단순 이메일
      userInfo.innerText = decoded.role === 'admin' ? `👤 관리자 (${emailVal})` : `👤 ${emailVal}`;
      logoutBtn.style.display = 'inline-block';
    } else {
      userInfo.innerText = '';
      logoutBtn.style.display = 'none';
    }
  }
  
  $('logout-btn').onclick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser();
    $('content').innerHTML = '<p>로그아웃되었습니다.</p>';
  };

  setUser();

  /*=========================
     동물 보기 (Petfinder API 연동)
  ==========================*/
  document.getElementById('btn-animals').addEventListener('click', async () => {
    console.log("동물 보기 버튼 클릭됨");
    try {
      const res = await fetch('/petfinder/animals');
      console.log("fetch 요청 상태:", res.status);
      if (!res.ok) throw new Error('동물 데이터 호출 실패: ' + res.statusText);
      const data = await res.json();
      console.log("Petfinder API 응답 데이터:", data);
      if (!data.animals || !Array.isArray(data.animals))
        throw new Error('동물 데이터 형식 오류');
      renderPetfinderAnimals(data.animals);
    } catch (error) {
      console.error("동물 보기 기능 에러:", error);
      alert(error.message);
    }
  });

  function renderPetfinderAnimals(animals) {
    let html = `<h2>입양 가능한 반려동물</h2>`;
    html += `<div class="grid">`;
    animals.forEach(animal => {
      html += `
        <div class="card pet-card" data-animal-id="${animal.id}">
          <img src="${animal.primary_photo_cropped?.small || 'default_image.jpg'}" alt="${animal.name || '동물 사진'}">
          <h3>${animal.name || '정보없음'}</h3>
          <p>품종: ${animal.breeds?.primary || '정보없음'}</p>
          <p>위치: ${animal.contact?.address?.postcode || '정보없음'}</p>
          ${currentUserEmail() ? `<button class="btn-edit-pet" data-animal-id="${animal.id}">수정</button>` : ''}
        </div>
      `;
    });
    html += `</div>`;
    $('content').innerHTML = html;

    // 각 카드를 클릭하면 상세 정보 모달 표시
    document.querySelectorAll('.pet-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit-pet')) return;
        const animalId = card.getAttribute('data-animal-id');
        const animal = animals.find(a => String(a.id) === animalId);
        if (animal) showPetfinderAnimalDetail(animal);
      });
    });

    // 수정 버튼 이벤트 처리
    document.querySelectorAll('.btn-edit-pet').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const animalId = btn.getAttribute('data-animal-id');
        const animal = animals.find(a => String(a.id) === animalId);
        if (animal) showPetfinderAnimalEditForm(animal);
      });
    });
  }

  function showPetfinderAnimalDetail(animal) {
    const detailHTML = `
      <div class="modal">
        <button id="close-detail" class="close-btn">&times; 닫기</button>
        <img src="${animal.primary_photo_cropped?.medium || 'default_image.jpg'}" alt="${animal.name || '동물 사진'}">
        <h2>${animal.name || '정보없음'}</h2>
        <p><strong>성별:</strong> ${animal.gender || '정보없음'}</p>
        <p><strong>품종:</strong> ${animal.breeds?.primary || '정보없음'}</p>
        <p><strong>나이:</strong> ${animal.age || '정보없음'}</p>
        <p><strong>위치:</strong> ${animal.contact?.address?.postcode || '정보없음'}</p>
      </div>
    `;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = detailHTML;
    document.body.appendChild(overlay);
    document.getElementById('close-detail').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  }

  function showPetfinderAnimalEditForm(animal) {
    const editHTML = `
      <div class="modal">
        <button id="close-edit" class="close-btn">&times; 닫기</button>
        <h2>동물 정보 수정</h2>
        <form id="edit-animal-form" class="form-container">
          <label>이름:</label>
          <input name="name" value="${animal.name || ''}" required>
          <label>품종:</label>
          <input name="breed" value="${animal.breeds?.primary || ''}">
          <label>나이:</label>
          <input name="age" value="${animal.age || ''}">
          <label>성별:</label>
          <input name="gender" value="${animal.gender || ''}">
          <label>이미지 URL:</label>
          <input name="image_url" value="${animal.primary_photo_cropped?.medium || ''}">
          <label>위치(우편번호):</label>
          <input name="location" value="${animal.contact?.address?.postcode || ''}">
          <button type="submit">수정 완료</button>
        </form>
      </div>
    `;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = editHTML;
    document.body.appendChild(overlay);
    document.getElementById('close-edit').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    document.getElementById('edit-animal-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const updatedData = {
        name: formData.get('name'),
        breed: formData.get('breed'),
        age: formData.get('age'),
        gender: formData.get('gender'),
        image_url: formData.get('image_url'),
        location: formData.get('location')
      };
      try {
        const response = await fetch(`/animals/api/${animal.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData)
        });
        if (!response.ok) throw new Error('수정 요청 실패');
        alert('동물 정보가 수정되었습니다.');
        document.body.removeChild(overlay);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  /*=========================
     플로팅 게시글 추가 버튼 생성
  ==========================*/
  function createFloatingAddButton() {
    let existingBtn = document.getElementById('floating-add-btn');
    if (!existingBtn) {
      const addBtn = document.createElement('button');
      addBtn.id = 'floating-add-btn';
      addBtn.innerText = '+';
      document.body.appendChild(addBtn);
      addBtn.addEventListener('click', () => {
        showPostFormModal();
      });
    }
  }
  createFloatingAddButton();

  /* 게시글 작성 모달 (이미지 업로드 포함) */
  function showPostFormModal() {
    const postCategories = ['질문', '정보', '꿀팁공유', '자랑'];
    const modalHTML = `
      <div class="modal">
        <button id="close-post-modal" class="close-btn">&times; 닫기</button>
        <h2>새 게시글 작성</h2>
        <form id="post-form-modal" class="form-container">
          <input name="title" placeholder="제목" required>
          <select name="category" required>
            ${postCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
          </select>
          <textarea name="content" placeholder="내용" required></textarea>
          <div id="image-drop-area" class="image-drop-area">
            <span>+</span>
            <p>이미지 업로드 (클릭 또는 드래그 앤 드롭)</p>
            <input id="image-file-input" type="file" accept="image/*" style="display: none;">
          </div>
          <input type="hidden" name="image_url" id="post-image-url">
          <button type="submit">작성</button>
        </form>
      </div>
    `;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = modalHTML;
    document.body.appendChild(overlay);
    
    document.getElementById('close-post-modal').addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
    
    const imageDropArea = document.getElementById('image-drop-area');
    const imageFileInput = document.getElementById('image-file-input');
    const hiddenImageUrlInput = document.getElementById('post-image-url');
    
    imageDropArea.addEventListener('click', () => {
      imageFileInput.click();
    });
    
    imageFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await uploadImage(file);
      }
    });
    
    imageDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      imageDropArea.style.borderColor = '#004f9e';
    });
    imageDropArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      imageDropArea.style.borderColor = '#ccc';
    });
    imageDropArea.addEventListener('drop', async (e) => {
      e.preventDefault();
      imageDropArea.style.borderColor = '#ccc';
      const file = e.dataTransfer.files[0];
      if (file) {
        await uploadImage(file);
      }
    });
    
    async function uploadImage(file) {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await fetch('/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('이미지 업로드 실패');
        const data = await res.json();
        hiddenImageUrlInput.value = data.url;
        imageDropArea.innerHTML = `<img src="${data.url}" alt="업로드 이미지" style="max-width:100%; max-height:100%;">`;
      } catch (err) {
        alert(err.message);
      }
    }
    
    document.getElementById('post-form-modal').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        const postData = {
          title: f.title.value,
          content: f.content.value,
          category: f.category.value,
          image_url: hiddenImageUrlInput.value
        };
        const res = await fetch('/articles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
          },
          body: JSON.stringify(postData)
        });
        console.log("POST /articles 응답 상태:", res.status);
        const result = await res.json();
        console.log("POST /articles 응답 내용:", result);
        if (!res.ok) {
          alert('게시글 작성 실패: ' + result.message);
          return;
        }
        alert('게시글이 작성되었습니다.');
        document.body.removeChild(overlay);
        $('btn-board').click(); // 게시판 목록 갱신
      } catch (err) {
        console.error("게시글 작성 오류:", err);
        alert(err.message);
      }
    });
  }

  /*=========================
     게시판 기능: 목록 및 상세 페이지
  ==========================*/
  document.getElementById('btn-board').addEventListener('click', async () => {
    try {
      const res = await fetch('/articles');
      if (!res.ok) throw new Error('게시글 불러오기 실패: ' + res.statusText);
      const data = await res.json();
      const articles = data.articles;
      renderBoard(articles);
    } catch (e) {
      alert(e.message);
    }
  });
  
  // 게시판 네비게이션용 카테고리 배열 (전체 포함)
  const boardCategories = ['전체', '잡담', '질문', '정보', '꿀팁공유', '자랑'];
  
  function renderBoard(articles) {
    let boardHTML = `<h2>게시판</h2>`;
    boardHTML += `<div class="category-nav">`;
    boardCategories.forEach(cat => {
      boardHTML += `<button class="cat-btn" data-category="${cat}">${cat}</button>`;
    });
    boardHTML += `</div>`;
    boardHTML += `<div id="article-list">`;
    if (articles.length === 0) {
      boardHTML += `<p>게시글이 없습니다.</p>`;
    } else {
      articles.forEach(article => {
        const isMyArticle = article.user_email && (article.user_email === currentUserEmail() || parseJwt(token()).role === 'admin');
        boardHTML += `
          <div class="article-list-item" data-article-id="${article.id}" data-category="${article.category}">
            <div class="article-summary" style="cursor:pointer; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center;">
                <span class="article-category" style="font-weight:bold; margin-right:8px;">${article.category}</span>
                <div>
                  <h3 class="article-title">${article.title}</h3>
                  <div class="article-meta" style="font-size:0.8rem; color:#666;">
                    ${article.created_at || ''}
                  </div>
                </div>
              </div>
              ${isMyArticle ? `<span style="color: green; font-weight: bold;">내 게시글</span>` : ''}
            </div>
          </div>
          <hr style="margin:20px 0;">
        `;
      });
    }
    boardHTML += `</div>`;
    $('content').innerHTML = boardHTML;
  
    document.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selectedCat = btn.getAttribute('data-category');
        filterArticlesByCategory(selectedCat, articles);
      });
    });
  
    document.querySelectorAll('.article-list-item').forEach(item => {
      item.addEventListener('click', () => {
        const articleId = item.getAttribute('data-article-id');
        loadArticleDetail(articleId);
      });
    });
  }
  
  function filterArticlesByCategory(selectedCat, articles) {
    let filteredArticles = selectedCat === '전체'
      ? articles
      : articles.filter(article => article.category === selectedCat);
  
    let html = '';
    if (filteredArticles.length === 0) {
      html = `<p>선택한 카테고리에 게시글이 없습니다.</p>`;
    } else {
      filteredArticles.forEach(article => {
        html += `
          <div class="article-list-item" data-article-id="${article.id}" data-category="${article.category}">
            <div class="article-summary" style="cursor:pointer; display: flex; align-items: center;">
              <span class="article-category" style="font-weight:bold; margin-right:8px;">${article.category}</span>
              <div>
                <h3 class="article-title">${article.title}</h3>
                <div class="article-meta" style="font-size:0.8rem; color:#666;">
                  ${article.created_at || ''}
                </div>
              </div>
            </div>
          </div>
          <hr style="margin:20px 0;">
        `;
      });
    }
    document.getElementById('article-list').innerHTML = html;
  }
  
  async function loadArticleDetail(articleId) {
    try {
      let res = await fetch(`/articles/${articleId}`);
      let article;
      if (res.ok) {
        article = await res.json();
      } else {
        res = await fetch('/articles');
        const data = await res.json();
        article = data.articles.find(a => String(a.id) === String(articleId));
      }
      if (!article) throw new Error("게시글을 찾을 수 없습니다.");
      renderArticleDetail(article);
    } catch (err) {
      alert(err.message);
    }
  }
  
  function renderArticleDetail(article) {
    const isMyArticle = article.user_email && (article.user_email === currentUserEmail() || parseJwt(token()).role === 'admin');
    let headerHTML = `<div class="detail-header" style="position: relative; padding: 10px; background-color: #fff;">`;
    headerHTML += `<button id="back-to-board">← 게시판으로 돌아가기</button>`;
    headerHTML += `<h2 class="detail-title">${article.title}</h2>`;
    if (isMyArticle) {
      headerHTML += `<div class="detail-actions" style="position: absolute; top: 10px; right: 10px;">
                       <button id="detail-edit-btn" style="background-color:#003d7a; color:#fff; margin-right:5px;">수정</button>
                       <button id="detail-delete-btn" style="background-color:crimson; color:#fff;">삭제</button>
                     </div>`;
    }
    headerHTML += `</div>`;
    
    let imageHtml = "";
    if (article.image_url && article.image_url.trim() !== "") {
      if (article.image_url.indexOf(',') !== -1) {
        const images = article.image_url.split(',').map(img => img.trim()).filter(img => img !== '');
        if (images.length > 0) {
          images.forEach(url => {
            imageHtml += `<img class="detail-image" src="${url}" alt="게시글 이미지" style="max-width:150px; cursor:pointer; margin-right:10px;">`;
          });
        } else {
          imageHtml = `<p>이미지: 없음</p>`;
        }
      } else {
        imageHtml = `<img class="detail-image" src="${article.image_url.trim()}" alt="게시글 이미지" style="max-width:150px; cursor:pointer; margin-right:10px;">`;
      }
    } else {
      imageHtml = `<p>이미지: 없음</p>`;
    }
    
    let html = headerHTML;
    html += `<div class="image-gallery">${imageHtml}</div>`;
    html += `<div class="detail-content"><p>${article.content}</p></div>`;
    html += `<hr>`;
    html += `<div class="comments-section-detail"><h3>댓글</h3><div id="comments-container"></div></div>`;
    html += `<div class="comment-form-detail">
               <form id="detail-comment-form" class="form-container">
                 <textarea name="content" placeholder="댓글 작성" required></textarea>
                 <button type="submit">댓글 작성</button>
               </form>
             </div>`;
    $('content').innerHTML = html;
  
    document.getElementById('back-to-board').addEventListener('click', () => {
      $('btn-board').click();
    });
  
    if (isMyArticle) {
      document.getElementById('detail-edit-btn').addEventListener('click', () => {
        loadArticleForEdit(article.id);
      });
      document.getElementById('detail-delete-btn').addEventListener('click', async () => {
        if (!confirm('게시글을 삭제하시겠습니까?')) return;
        const res = await fetch(`/articles/${article.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer ' + token() }
        });
        if (!res.ok) {
          alert('게시글 삭제 실패');
          return;
        }
        $('btn-board').click();
      });
    }
  
    document.querySelectorAll('.detail-image').forEach(img => {
      img.addEventListener('click', () => {
        showEnlargedImage(img.src);
      });
    });
  
    loadCommentsDetail(article.id);
  
    document.getElementById('detail-comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const content = form.content.value;
      try {
        const res = await fetch(`/articles/comments/${article.id}`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
             'Authorization': 'Bearer ' + token()
           },
           body: JSON.stringify({ content })
        });
        if (!res.ok) { alert("댓글 작성 실패"); return; }
        const result = await res.json();
        appendCommentDetail(article.id, {
           id: result.commentId,
           content,
           user_email: currentUserEmail(),
           created_at: new Date().toLocaleString()
        });
        form.content.value = "";
      } catch (err) {
        alert(err.message);
      }
    });
  }
  
  async function loadCommentsDetail(articleId) {
    try {
      const res = await fetch(`/articles/comments/${articleId}`);
      if (!res.ok) { alert("댓글 불러오기 실패"); return; }
      const comments = await res.json();
      let container = document.getElementById('comments-container');
      container.innerHTML = "";
      comments.forEach(comment => {
         container.innerHTML += `<p><strong>${comment.user_email || '익명'}</strong> (${comment.created_at}): ${comment.content}</p>`;
      });
    } catch(err) {
      alert(err.message);
    }
  }
  
  function appendCommentDetail(articleId, comment) {
    let container = document.getElementById('comments-container');
    container.innerHTML += `<p><strong>${comment.user_email}</strong> (${comment.created_at}): ${comment.content}</p>`;
  }
  
  async function loadArticleForEdit(articleId) {
    const res = await fetch('/articles');
    if (!res.ok) return alert('게시글 불러오기 실패');
    const data = await res.json();
    const article = data.articles.find(a => String(a.id) === String(articleId));
    if (!article) return alert('게시글을 찾을 수 없습니다.');
    $('content').innerHTML = `
      <h2>게시글 수정</h2>
      <form id="edit-form" data-article-id="${article.id}" class="form-container">
        <input name="title" value="${article.title}" required>
        <textarea name="content" required>${article.content}</textarea>
        <button type="submit">수정</button>
      </form>
    `;
    const editForm = document.getElementById('edit-form');
    editForm.addEventListener('submit', async e => {
      e.preventDefault();
      const f = e.target;
      const res = await fetch(`/articles/${article.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token()
        },
        body: JSON.stringify({ title: f.title.value, content: f.content.value })
      });
      if (!res.ok) return alert('게시글 수정 실패');
      $('btn-board').click();
    });
  }
  
  function toggleCommentsDisplay(articleId) {
    const container = document.getElementById('comments-' + articleId);
    const section = container.querySelector('.comments-section');
    if (section.style.display === 'none' || section.style.display === '') {
      section.style.display = 'block';
      container.setAttribute('data-loaded', '0');
      loadComments(articleId, 0);
    } else {
      section.style.display = 'none';
    }
  }
  
  async function loadComments(articleId, startIndex = 0) {
    try {
      const cRes = await fetch(`/articles/comments/${articleId}`);
      if (!cRes.ok) {
        alert('댓글 불러오기 실패');
        return;
      }
      const comments = await cRes.json();
      const container = document.getElementById('comments-' + articleId);
      const listElem = container.querySelector('.comments-list');
      let loaded = parseInt(container.getAttribute('data-loaded')) || 0;
      if (startIndex === 0) {
        listElem.innerHTML = '';
        loaded = 0;
      }
      const count = (loaded === 0) ? 3 : 5;
      const newComments = comments.slice(loaded, loaded + count);
      newComments.forEach(c => {
        listElem.innerHTML += `
          <li style="margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">
            <div style="font-size:0.8rem; color:#555;">
              ${c.user_email || '익명'} - ${c.created_at || ''}
            </div>
            <div style="font-size:0.95rem; margin-left:10px;">
              ${c.content}
            </div>
            ${
              (currentUserEmail() && c.user_email && currentUserEmail() === c.user_email)
              ? `<button class="btn-delete-comment" data-comment-id="${c.id}" style="background-color: crimson; color: white; border: none; padding:4px 8px; border-radius:4px; font-size:0.8rem;">삭제</button>`
              : ''
            }
          </li>
        `;
      });
      loaded += newComments.length;
      container.setAttribute('data-loaded', loaded.toString());
      const btnMore = container.querySelector('.btn-more-comments');
      if (loaded < comments.length) {
        btnMore.style.display = 'inline';
        btnMore.innerText = '↓더보기';
        btnMore.onclick = () => loadComments(articleId, loaded);
      } else {
        btnMore.style.display = 'none';
      }
      container.querySelectorAll('.btn-delete-comment').forEach(btn => {
        btn.onclick = async () => {
          const commentId = btn.getAttribute('data-comment-id');
          if (confirm('댓글을 삭제하시겠습니까?')) {
            const res = await fetch(`/articles/comments/${commentId}`, {
              method: 'DELETE',
              headers: { 'Authorization': 'Bearer ' + token() }
            });
            if (!res.ok) return alert('댓글 삭제 실패');
            btn.parentElement.remove();
          }
        };
      });
    } catch (e) {
      console.error("댓글 로딩 오류:", e);
      alert(e.message);
    }
  }
  
  function appendCommentDetail(articleId, comment) {
    let container = document.getElementById('comments-container');
    container.innerHTML += `<p><strong>${comment.user_email}</strong> (${comment.created_at}): ${comment.content}</p>`;
  }
  
  /*=========================
     로그인/회원가입 폼 처리
  ==========================*/
  $('btn-login').onclick = () => {
    $('content').innerHTML = `
      <h2>로그인</h2>
      <form id="login-form" class="form-container">
        <input name="email" type="email" placeholder="이메일" required>
        <input name="password" type="password" placeholder="비밀번호" required>
        <button type="submit">로그인</button>
      </form>
    `;
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const res = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value, password: f.password.value })
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
    });
  };

  $('btn-signup').onclick = () => {
    $('content').innerHTML = `
      <h2>회원가입</h2>
      <form id="signup-form" class="form-container">
        <input name="email" type="email" placeholder="이메일" required>
        <input name="password" type="password" placeholder="비밀번호" required>
        <button type="submit">회원가입</button>
      </form>
    `;
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const res = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: f.email.value, password: f.password.value })
      });
      if (res.ok) {
        alert('회원가입 완료!');
        $('btn-login').click();
      } else {
        const result = await res.json();
        alert(result.message);
      }
    });
  };

  /*=========================
     사용자 정보 표시
  ==========================*/
  function setUser() {
    const emailVal = localStorage.getItem('email');
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');
    if (emailVal && token()) {
      const decoded = parseJwt(token());
      userInfo.innerText = decoded.role === 'admin' ? `👤 관리자 (${emailVal})` : `👤 ${emailVal}`;
      logoutBtn.style.display = 'inline-block';
    } else {
      userInfo.innerText = '';
      logoutBtn.style.display = 'none';
    }
  }
  
  setUser();
});
