import './research.css';
import './career.css';
import './style.css';
import './phone.css';
import './navigation-hud.css';
import './life.css';
import './phone-layout.css';
import { Game } from './core/Game.js';
try { new Game(); } catch(error) { console.error(error);document.querySelector('#boot-error').textContent='無法啟動 3D 畫面。請使用支援 WebGL 2 的瀏覽器並開啟硬體加速。';document.querySelector('#start').textContent='3D 啟動失敗'; }

import './assistant-hud.css';

import './mobile.css';

import './title.css';
import './tutorial.css';

import './context-actions.css';

import './landscape-work.css';
import './research-workspace.css';

import './phone-attention.css';
