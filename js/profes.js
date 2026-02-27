(function () {
  'use strict';

  var DATA_URL = 'data/profes.json';

  function padNumber(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function buildTabContent(profes) {
    return profes.map(function (prof, i) {
      var num = padNumber(i + 1);
      var activeClass = i === 0 ? ' active fade in show' : ' fade in';
      var socialHtml = '';
      if (prof.social) {
        var items = '';
        if (prof.social.facebook) {
          items += '<li><a class="facebook" href="' + prof.social.facebook + '" target="_blank"><i class="fa-brands fa-facebook-f"></i><span></span></a></li>';
        }
        if (prof.social.instagram) {
          items += '<li><a class="instagram" href="' + prof.social.instagram + '" target="_blank"><i class="fa-brands fa-instagram"></i><span></span></a></li>';
        }
        if (items) {
          socialHtml = '<div class="elements-social social-icon-style-09"><ul class="medium-icon dark">' + items + '</ul></div>';
        }
      }

      return '<div class="tab-pane' + activeClass + '" id="tab_nine' + (i + 1) + '">' +
        '<div class="row g-0 row-cols-1 row-cols-md-2">' +
          '<div class="col p-55px xl-p-40px lg-p-30px">' +
            '<h4 class="alt-font fw-600 text-dark-gray mb-0">' + prof.name + '</h4>' +
            '<span class="fs-18 fw-500 text-base-color">' + prof.role + '</span>' +
            '<div class="divider-style-03 divider-style-03-01 border-color-extra-medium-gray mt-15px mb-15px"></div>' +
            '<p>' + prof.description + '</p>' +
            socialHtml +
          '</div>' +
          '<div class="col position-relative cover-background" style="background-image:url(\'' + prof.photo + '\');">' +
            '<span class="fs-190 fw-700 alt-font text-white position-absolute left-minus-30px bottom-minus-50px">' + num + '.</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('\n');
  }

  function buildTabNav(profes) {
    return profes.map(function (prof, i) {
      var num = padNumber(i + 1);
      var activeClass = i === 0 ? ' active' : '';
      var roleDisplay = prof.role.charAt(0).toUpperCase() + prof.role.slice(1).toLowerCase();
      return '<li class="nav-item">' +
        '<a class="nav-link' + activeClass + '" data-bs-toggle="tab"' +
        ' href="#tab_nine' + (i + 1) + '">' +
          '<span class="number fs-22 me-5px">' + num + '.</span>' +
          '<span class="name fs-22 text-dark-gray">' + prof.name + '</span>' +
          '<span class="text-medium-gray ms-auto">' + roleDisplay + '</span>' +
        '</a>' +
      '</li>';
    }).join('\n');
  }

  function render(data) {
    var profes = data.profes.sort(function (a, b) { return a.order - b.order; });
    var tabContent = document.getElementById('profes-tab-content');
    var tabNav = document.getElementById('profes-tab-nav');
    if (tabContent) tabContent.innerHTML = buildTabContent(profes);
    if (tabNav) tabNav.innerHTML = buildTabNav(profes);
  }

  function loadProfes() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', DATA_URL, false); // synchronous to load before main.js
    xhr.send();
    if (xhr.status === 200) {
      var data = JSON.parse(xhr.responseText);
      render(data);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProfes);
  } else {
    loadProfes();
  }
})();
