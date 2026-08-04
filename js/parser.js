/* ============================================================
 * 문제은행 DOCX 파서
 * data/question-bank.docx 를 mammoth.js 로 읽어
 * {part, q, c[], a, e} 형식의 문제 배열 500개로 변환한다.
 *
 * 문서 구조 (mammoth 변환 결과 기준):
 *   H1        : 파트 번호 ("01" ~ "07")
 *   H2/H3     : 파트 제목 (무시)
 *   H4        : 문제 지문 (총 500개) → H4 단위로 블록 분할
 *   P ①...    : 보기 (2단 편집이라 순서가 뒤섞여 ②④가
 *                "정 답/해 설" 라벨 뒤에 나올 수 있음)
 *   P "④"     : 단독 원문자 = 정답
 *   P "정 답" / P "해 설" : 라벨
 *   해설 텍스트: "해 설" 라벨 이후의 비마커 문단
 * ============================================================ */
(function () {
  'use strict';

  var CIRC = '①②③④⑤';

  function circNum(ch) {
    var i = CIRC.indexOf(ch);
    return i >= 0 ? i + 1 : 0;
  }

  function clean(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  // 한 블록(H4 + 후속 요소들)을 문제 객체로 변환
  function parseBlock(block, part) {
    var qEl = block[0];
    var cur = {
      part: part,
      q: clean(qEl.textContent).replace(/^\d{1,3}\s*[.．)]\s*/, ''),
      c: [], a: 0, e: ''
    };
    var seenExpl = false;      // "해 설" 라벨을 지났는가
    var lastChoice = -1;       // 마지막으로 채워진 보기 인덱스 (줄바꿈 이어붙임용)

    function addChoiceText(text) {
      var segs = text.split(/(?=[①②③④⑤])/);
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i].trim();
        if (!seg) continue;
        var n = circNum(seg.charAt(0));
        if (n === 0) {
          if (lastChoice >= 0) cur.c[lastChoice] += ' ' + seg;
          continue;
        }
        var body = seg.slice(1).trim();
        if (cur.c[n - 1]) cur.c[n - 1] += ' ' + body;
        else cur.c[n - 1] = body;
        lastChoice = n - 1;
      }
    }

    function handleText(text, listIndex) {
      if (!text) return;

      // 라벨
      if (/^정\s*답$/.test(text)) return;
      if (/^해\s*설$/.test(text)) { seenExpl = true; return; }

      // "정답 ④" 인라인 형태
      var ansInline = text.match(/^정\s*답\s*[:：]?\s*([①②③④⑤])$/);
      if (ansInline) { if (!cur.a) cur.a = circNum(ansInline[1]); return; }

      // 단독 원문자 = 정답
      if (/^[①②③④⑤]$/.test(text)) { if (!cur.a) cur.a = circNum(text); return; }

      var startsWithMark = /^[①②③④⑤]/.test(text);
      var hasMark = /[①②③④⑤]/.test(text);

      if (startsWithMark) { addChoiceText(text); return; }

      if (hasMark) {
        // 지문(또는 해설)과 보기가 한 문단에 섞인 경우
        var fm = text.search(/[①②③④⑤]/);
        var head = text.slice(0, fm).trim();
        if (head) {
          if (seenExpl) cur.e += (cur.e ? '\n' : '') + head;
          else if (lastChoice >= 0) cur.c[lastChoice] += ' ' + head;
          else cur.q += '\n' + head;
        }
        addChoiceText(text.slice(fm));
        return;
      }

      // 마커 없는 일반 문단
      if (seenExpl) {
        cur.e += (cur.e ? '\n' : '') + text;
      } else if (lastChoice >= 0) {
        // 보기 줄바꿈 이어붙임
        cur.c[lastChoice] += ' ' + text;
      } else {
        // 문제 지문 계속 (목록 항목이면 번호 붙임)
        cur.q += '\n' + (listIndex !== undefined ? '(' + listIndex + ') ' : '') + text;
      }
    }

    for (var i = 1; i < block.length; i++) {
      var el = block[i];
      var tag = el.tagName;
      if (tag === 'IMG') continue;

      if (tag === 'OL' || tag === 'UL') {
        var lis = el.querySelectorAll('li');
        for (var li = 0; li < lis.length; li++) {
          handleText(clean(lis[li].textContent), li + 1);
        }
        continue;
      }
      handleText(clean(el.textContent));
    }

    // 검증
    if (!cur.q || cur.c.length < 2 || !cur.a || cur.a > cur.c.length) return null;
    for (var k = 0; k < cur.c.length; k++) {
      if (!cur.c[k]) return null;
    }
    cur.q = cur.q.trim();
    cur.e = cur.e.trim();
    return cur;
  }

  function parseDoc(doc) {
    var els = doc.body.children;
    var questions = [];
    var part = 0;
    var block = null;

    function flush() {
      if (block) {
        var q = parseBlock(block, part || 1);
        if (q) questions.push(q);
      }
      block = null;
    }

    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var tag = el.tagName;

      if (tag === 'H1') {
        flush();
        var m = clean(el.textContent).match(/^0?([1-7])$/);
        if (m) part = parseInt(m[1], 10);
        continue;
      }
      if (tag === 'H2' || tag === 'H3') { flush(); continue; }
      if (tag === 'H4') { flush(); block = [el]; continue; }
      if (block) block.push(el);
    }
    flush();
    return questions;
  }

  // 공개 API: 문제은행 로드
  window.loadQuestionBank = function () {
    return fetch('data/question-bank.docx')
      .then(function (resp) {
        if (!resp.ok) throw new Error('문제은행 파일을 불러올 수 없습니다 (' + resp.status + ')');
        return resp.arrayBuffer();
      })
      .then(function (buf) {
        return window.mammoth.convertToHtml({ arrayBuffer: buf });
      })
      .then(function (result) {
        var doc = new DOMParser().parseFromString(result.value, 'text/html');
        var questions = parseDoc(doc);
        var stats = {};
        questions.forEach(function (q) { stats[q.part] = (stats[q.part] || 0) + 1; });
        console.log('[문제은행] 총 ' + questions.length + '문항 파싱 완료. 파트별:', JSON.stringify(stats));
        if (questions.length < 100) throw new Error('파싱된 문항 수가 비정상적으로 적습니다: ' + questions.length);
        return questions;
      });
  };
})();
