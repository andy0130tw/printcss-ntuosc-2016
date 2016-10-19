#!/usr/bin/env node
const fs = require('fs');

const kramed = require('kramed');
const markdownIt = require('markdown-it')();

const template = fs.readFileSync(__dirname + '/template.html', 'utf-8');

var summary = fs.readFileSync(__dirname + '/../SUMMARY.md', 'utf-8');

// travase through summary to build the TOC
function buildTOC(summary) {
  var tokens = markdownIt.parse(summary);

  // tree!!
  var stack = [], list = [], curList = null, curNode = null;
  tokens.forEach((node, i) => {
    switch (node.type) {
      case 'bullet_list_open':
        if (curList == null) {
          curList = [];
        } else {
          if (!curNode)
            throw new Error('Expecting current node, got null');
          curList = [];
          curNode = null;
        }
        stack.push(curList);
        break;

      case 'bullet_list_close':
        if (!stack.length)
          throw new Error('Stack underflow!');
        stack.pop();
        curList = stack[stack.length - 1];
        break;

      case 'list_item_open':
        list.push(curNode = {});
        break;

      case 'list_item_close':
        curNode = null;
        break;

      case 'inline':
        if (curNode) {
          curNode.title = node.children[1].content;
          curNode.url = node.children[0].attrs[0][1];
          curNode.level = Math.floor((node.level - 1) / 2);
        }
        break;
    }
  });
  if (stack.length)
    throw new Error('Non-balanced tokens!');
  return list;
}

var toc = buildTOC(summary);
var body = toc.map(function(entry) {
  if (entry.url.indexOf('#') >= 0) return '';
  var raw = fs.readFileSync(__dirname + '/../' + entry.url, 'utf-8');
  var content = kramed(raw);

  return `<section class="markdown-section normal">${content}</section>`;

}).join('');

// naive template
console.log(template.replace('{{ body }}', body));
