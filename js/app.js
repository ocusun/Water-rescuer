/* 수상구조사 필기시험 모의고사 */
(function () {
  'use strict';

  var SUBJECTS = [
    { part: 1, name: '수상구조사의 자세', count: 3 },
    { part: 2, name: '조난사고의 이해',   count: 6 },
    { part: 3, name: '관련 법령',         count: 6 },
    { part: 4, name: '응급처치',          count: 8 },
    { part: 5, name: '구조기술',          count: 8 },
    { part: 6, name: '지도자의 자질',     count: 4 },
    { part: 7, name: '생존수영',          count: 5 }
  ];
  var TOTAL_QUESTIONS = 40;
  var PASS_SCORE = 60;
  var PAGE_SIZE = 5;

  var bank = [];
  var exam = [];
  var answers = [];
  var currentPage = 0;

  function $(id) { return document.getElementById(id); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function circled(n) { return ['①', '②', '③', '④', '⑤'][n - 1] || n; }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function showScreen(id) {
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('active');
    $(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  function renderStart() {
    var wrap = $('subject-summary');
    var html = '';
    SUBJECTS.forEach(function (s) {
      var n = bank.filter(function (q) { return q.part === s.part; }).length;
      html += '<div class="subj"><span>' + s.name + '</span><b>' + s.count + '문제' +
        (n ? ' <small style="color:#94a3b8;font-weight:400">/' + n + '문항</small>' : '') + '</b></div>';
    });
    wrap.innerHTML = html;
    if (bank.length > 0) {
      $('bank-status').textContent = '문제은행 등록 문항: 총 500개 · 시작할 때마다 새로운 40문제가 출제됩니다.';
    }
  }

  function setStartReady() {
    var btn = $('start-btn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-play"></i> 시험 시작';
  }

  function setStartError(msg) {
    var btn = $('start-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 문제은행 로드 실패';
    $('bank-status').textContent = msg + ' — 페이지를 새로고침 해보세요.';
  }

  function buildExam() {
    exam = [];
    SUBJECTS.forEach(function (s) {
      var pool = bank.filter(function (q) { return q.part === s.part; });
      var picked = shuffle(pool).slice(0, Math.min(s.count, pool.length));
      picked.forEach(function (q) {
        exam.push({
          subject: s.name, part: s.part,
          q: q.q, c: q.c, a: q.a, e: q.e || ''
        });
      });
    });
    if (exam.length < TOTAL_QUESTIONS) {
      var used = {};
      exam.forEach(function (q) { used[q.q] = true; });
      var rest = shuffle(bank.filter(function (q) { return !used[q.q]; }));
      for (var i = 0; i < rest.length && exam.length < TOTAL_QUESTIONS; i++) {
        var s = SUBJECTS.filter(function (x) { return x.part === rest[i].part; })[0];
        exam.push({
          subject: s ? s.name : '기타', part: rest[i].part,
          q: rest[i].q, c: rest[i].c, a: rest[i].a, e: rest[i].e || ''
        });
      }
    }
    exam = exam.slice(0, TOTAL_QUESTIONS);
    answers = exam.map(function () { return null; });
    currentPage = 0;
  }

  function totalPages() {
    return Math.ceil(exam.length / PAGE_SIZE);
  }

  function renderPage() {
    var start = currentPage * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, exam.length);
    var area = $('question-area');
    area.innerHTML = '';

    for (var i = start; i < end; i++) {
      var q = exam[i];
      var card = document.createElement('div');
      card.className = 'question-card';
      card.setAttribute('data-idx', i);

      var choicesHtml = '';
      q.c.forEach(function (choiceText, ci) {
        var n = ci + 1;
        var selected = answers[i] === n ? ' selected' : '';
        choicesHtml +=
          '<li class="choice' + selected + '" data-choice="' + n + '">' +
            '<span class="marker">' + circled(n) + '</span>' +
            '<span>' + escapeHtml(choiceText) + '</span>' +
          '</li>';
      });

      card.innerHTML =
        '<div class="question-meta">' +
          '<span class="subject-badge">PART ' + q.part + ' · ' + q.subject + '</span>' +
          '<span class="q-number">문제 ' + (i + 1) + ' / ' + exam.length + '</span>' +
        '</div>' +
        '<h2 class="q-text">' + escapeHtml(q.q) + '</h2>' +
        '<ol class="choices">' + choicesHtml + '</ol>';

      area.appendChild(card);
    }

    updateProgress();
    updateNav();
    window.scrollTo(0, 0);
  }

  $('question-area').addEventListener('click', function (e) {
    var li = e.target.closest('.choice');
    if (!li) return;
    var card = li.closest('.question-card');
    if (!card) return;
    var idx = parseInt(card.getAttribute('data-idx'), 10);
    if (isNaN(idx)) return;
    var n = parseInt(li.getAttribute('data-choice'), 10);
    if (isNaN(n)) return;

    answers[idx] = n;

    var choices = card.querySelectorAll('.choice');
    for (var j = 0; j < choices.length; j++) {
      var el = choices[j];
      if (parseInt(el.getAttribute('data-choice'), 10) === n) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    }
    updateProgress();
  });

  function updateProgress() {
    var answered = answers.filter(function (a) { return a !== null; }).length;
    $('exam-progress-text').textContent = (currentPage + 1) + ' / ' + totalPages() + ' 페이지';
    $('answered-count-text').textContent = '답안 ' + answered + ' / ' + exam.length + '개 작성';
    $('progress-fill').style.width = (answered / exam.length * 100) + '%';
  }

  function updateNav() {
    $('prev-btn').disabled = currentPage === 0;
    $('next-btn').disabled = currentPage >= totalPages() - 1;
  }

  function submitExam() {
    var unanswered = answers.filter(function (a) { return a !== null; }).length;
    if (unanswered > 0) {
      if (!confirm('아직 풀지 않은 문제가 ' + unanswered + '개 있습니다.\n그대로 제출할까요?')) return;
    }

    var correct = 0;
    var perSubject = {};
    SUBJECTS.forEach(function (s) {
      perSubject[s.name] = { correct: 0, total: 0 };
    });

    exam.forEach(function (q, i) {
      var isCorrect = answers[i] === q.a;
      if (isCorrect) correct++;
      if (perSubject[q.subject]) {
        perSubject[q.subject].total++;
        if (isCorrect) perSubject[q.subject].correct++;
      }
    });

    var score = Math.round(correct / exam.length * 100);
    $('score-value').textContent = score;

    var passMsg = $('pass-message');
    if (score >= PASS_SCORE) {
      passMsg.textContent = '🎉 합격입니다!';
      passMsg.className = 'pass-message pass';
    } else {
      passMsg.textContent = '아쉽지만 불합격입니다. 다시 도전해 보세요!';
      passMsg.className = 'pass-message fail';
    }

    $('score-detail').textContent =
      exam.length + '문제 중 ' + correct + '문제 정답 (합격 기준 ' + PASS_SCORE + '점 이상)';

    var wrap = $('subject-breakdown');
    wrap.innerHTML = '';
    SUBJECTS.forEach(function (s) {
      var r = perSubject[s.name];
      if (!r || r.total === 0) return;
      var pct = Math.round(r.correct / r.total * 100);
      var row = document.createElement('div');
      row.className = 'sb-row';
      row.innerHTML =
        '<span class="sb-name">' + s.name + '</span>' +
        '<div class="sb-bar"><div class="sb-fill" style="width:' + pct + '%"></div></div>' +
        '<span class="sb-score">' + r.correct + '/' + r.total + '</span>';
      wrap.appendChild(row);
    });

    $('review-area').classList.add('hidden');
    showScreen('result-screen');
  }

  function renderReview() {
    var mode = document.querySelector('input[name="review-filter"]:checked').value;
    var list = $('review-list');
    list.innerHTML = '';
    var shown = 0;

    exam.forEach(function (q, i) {
      var isCorrect = answers[i] === q.a;
      if (mode === 'wrong' && isCorrect) return;
      shown++;

      var item = document.createElement('article');
      item.className = 'review-item' + (isCorrect ? ' correct' : '');

      var choicesHtml = '';
      q.c.forEach(function (ct, ci) {
        var n = ci + 1;
        var cls = 'rv-choice';
        var tag = '';
        if (n === q.a) { cls += ' answer'; tag = '<span class="tag">정답</span>'; }
        if (answers[i] === n && n !== q.a) { cls += ' wrong-pick'; tag = '<span class="tag">내가 고른 답</span>'; }
        choicesHtml += '<li class="' + cls + '"><span>' + circled(n) + ' ' + escapeHtml(ct) + '</span>' + tag + '</li>';
      });

      var myAnswer = answers[i] === null ? '미응답' : circled(answers[i]);
      item.innerHTML =
        '<div class="rv-head">' +
          '<span class="subject-badge">PART ' + q.part + ' · ' + q.subject + '</span>' +
          '<span class="q-number">문제 ' + (i + 1) + '</span>' +
          '<span class="rv-result">' + (isCorrect ? '✔ 정답' : '✘ 오답 (내 답: ' + myAnswer + ')') + '</span>' +
        '</div>' +
        '<p class="rv-q">' + escapeHtml(q.q) + '</p>' +
        '<ul class="rv-choices">' + choicesHtml + '</ul>' +
        (q.e ? '<div class="rv-explain"><b>해설</b> ' + escapeHtml(q.e) + '</div>' : '');
      list.appendChild(item);
    });

    if (shown === 0) {
      list.innerHTML = '<p style="color:#16a34a;font-weight:700;text-align:center;padding:20px;">틀린 문제가 없습니다! 🎉</p>';
    }
  }

  $('start-btn').addEventListener('click', function () {
    if (bank.length === 0) { alert('문제은행 데이터가 없습니다.'); return; }
    buildExam();
    renderPage();
    showScreen('exam-screen');
  });

  $('prev-btn').addEventListener('click', function () {
    if (currentPage > 0) {
      currentPage--;
      renderPage();
    }
  });

  $('next-btn').addEventListener('click', function () {
    if (currentPage < totalPages() - 1) {
      currentPage++;
      renderPage();
    }
  });

  $('submit-btn').addEventListener('click', submitExam);

  $('retry-btn').addEventListener('click', function () {
    renderStart();
    showScreen('start-screen');
  });

  $('review-btn').addEventListener('click', function () {
    $('review-area').classList.toggle('hidden');
    if (!$('review-area').classList.contains('hidden')) renderReview();
  });

  var filters = document.querySelectorAll('input[name="review-filter"]');
  for (var i = 0; i < filters.length; i++) {
    filters[i].addEventListener('change', renderReview);
  }

  document.addEventListener('keydown', function (e) {
    if (!$('exam-screen').classList.contains('active')) return;
    if (e.key === 'ArrowLeft' && currentPage > 0) {
      currentPage--;
      renderPage();
    }
    if (e.key === 'ArrowRight' && currentPage < totalPages() - 1) {
      currentPage++;
      renderPage();
    }
  });

  renderStart();

  var partUrls = [
    'data/part1.json',
    'data/part2.json',
    'data/part3.json',
    'data/part4.json',
    'data/part5.json',
    'data/part6.json',
    'data/part7.json'
  ];
  Promise.all(partUrls.map(function (url) {
    return fetch(url).then(function (r) {
      if (!r.ok) {
        console.warn('부분 로드 실패:', url);
        return [];
      }
      return r.json().catch(function () { return []; });
    }).catch(function () { return []; });
  }))
    .then(function (parts) {
      bank = [];
      parts.forEach(function (p) { bank = bank.concat(p); });
      console.log('[문제은행] 총 ' + bank.length + '문항 로드 완료');
      if (bank.length === 0) {
        setStartError('문제은행 데이터를 불러올 수 없습니다');
        return;
      }
      renderStart();
      setStartReady();
    })
    .catch(function (err) {
      console.error(err);
      setStartError(String(err.message || err));
    });
})();
