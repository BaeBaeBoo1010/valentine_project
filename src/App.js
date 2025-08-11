import React, { useState, useRef, useEffect } from 'react';
import Confetti from 'react-confetti';
import './App.css';


// Kích thước ô và kích thước game
const TILE_SIZE = 30;
const ROWS = 15;
const COLS = 15;

// Hàm tạo mê cung ngẫu nhiên
const generateMaze = () => {
  const maze = Array.from({ length: ROWS }, () => Array(COLS).fill(1)); // Mê cung ban đầu toàn tường
  const stack = []; // Dùng để lưu trữ các ô đang được xử lý
  const directions = [
    { x: 0, y: -1 }, // Lên
    { x: 0, y: 1 },  // Xuống
    { x: -1, y: 0 }, // Trái
    { x: 1, y: 0 },  // Phải
  ];

  const isInBounds = (x, y) => x >= 0 && x < COLS && y >= 0 && y < ROWS;
  const shuffleDirections = () => directions.sort(() => Math.random() - 0.5); // Trộn hướng đi ngẫu nhiên

  // Bắt đầu từ ô (1, 1)
  maze[1][1] = 0;
  stack.push({ x: 1, y: 1 });

  while (stack.length > 0) {
    const { x, y } = stack[stack.length - 1];
    const neighbors = [];

    // Kiểm tra các ô kề liền có thể đi được (chỉ xét các ô chưa được mở)
    shuffleDirections().forEach(({ x: dx, y: dy }) => {
      const nx = x + dx * 2;
      const ny = y + dy * 2;
      if (isInBounds(nx, ny) && maze[ny][nx] === 1) {
        neighbors.push({ dx, dy, nx, ny });
      }
    });

    if (neighbors.length > 0) {
      // Chọn một hướng đi ngẫu nhiên
      const { dx, dy, nx, ny } = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze[ny][nx] = 0; // Mở ô mới
      maze[y + dy][x + dx] = 0; // Mở ô giữa ô hiện tại và ô mới
      stack.push({ x: nx, y: ny }); // Đẩy ô mới vào stack
    } else {
      stack.pop(); // Quay lại ô trước đó nếu không còn đường đi
    }
  }

  // Đảm bảo đích ở ô cuối cùng
  maze[ROWS - 2][COLS - 2] = 2; // Đích ở góc dưới bên phải
  maze[1][1] = 0; // Đảm bảo bắt đầu ở góc trên bên trái

  return maze;
};

// Vị trí nhân vật
let player = { x: 1, y: 1 };

const App = () => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false); // Trạng thái của modal
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [maze, setMaze] = useState(generateMaze()); // Mê cung được tạo ngẫu nhiên
  const canvasRef = useRef(null);

  // Hàm vẽ mê cung
  const drawMaze = (ctx) => {
    ctx.clearRect(0, 0, TILE_SIZE * COLS, TILE_SIZE * ROWS);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (maze[row][col] === 1) {
          ctx.fillStyle = '#ff6699'; // Màu tường
          ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (maze[row][col] === 2) {
          ctx.fillStyle = '#ffcc00'; // Màu đích
          ctx.font = "bold 20px Arial";
          ctx.fillText('💖', col * TILE_SIZE + 10, row * TILE_SIZE + 25);
        }
      }
    }

    // Vẽ nhân vật
    ctx.fillText('❤️', player.x * TILE_SIZE + 5, player.y * TILE_SIZE + 25);
  };

  // Kiểm tra xem di chuyển có hợp lệ không
  const canMove = (x, y) => {
    return maze[y] && (maze[y][x] === 0 || maze[y][x] === 2);
  };

  // Di chuyển nhân vật
  const movePlayer = (dx, dy, ctx) => {
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (canMove(newX, newY)) {
      player.x = newX;
      player.y = newY;
      drawMaze(ctx);

      if (maze[player.y][player.x] === 2) {
        setTimeout(() => {
          setShowConfetti(true);
          setShowModal(true);
        }, 300); // Hiển thị modal khi thắng
      }
    }
  };

  // Bắt sự kiện bàn phím
  const handleKeyDown = (e, ctx) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
        movePlayer(0, -1, ctx);
        break;
      case 'ArrowDown':
      case 's':
        movePlayer(0, 1, ctx);
        break;
      case 'ArrowLeft':
      case 'a':
        movePlayer(-1, 0, ctx);
        break;
      case 'ArrowRight':
      case 'd':
        movePlayer(1, 0, ctx);
        break;
    }
  };

  // Hiển thị mê cung khi ứng dụng được mount
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = TILE_SIZE * COLS;
    canvas.height = TILE_SIZE * ROWS;

    drawMaze(ctx);

    const handleKeyEvent = (e) => handleKeyDown(e, ctx);

    document.addEventListener('keydown', handleKeyEvent);

    return () => {
      document.removeEventListener('keydown', handleKeyEvent);
    };
  }, [maze]); // Thêm `maze` vào dependency để cập nhật lại khi mê cung thay đổi

  // Cập nhật kích thước của màn hình khi thay đổi kích thước cửa sổ
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Đóng modal
  const closeModal = () => {
    setShowModal(false);
    setShowConfetti(false); // Tắt confetti khi đóng modal
  
    // Tìm vị trí đích
    const targetX = COLS - 2;
    const targetY = ROWS - 2;
  
    // Danh sách các ô có thể đặt nhân vật bên cạnh đích
    const possiblePositions = [
      { x: targetX - 1, y: targetY }, // Bên trái
      { x: targetX + 1, y: targetY }, // Bên phải
      { x: targetX, y: targetY - 1 }, // Bên trên
      { x: targetX, y: targetY + 1 }  // Bên dưới
    ];
  
    // Chọn một vị trí hợp lệ
    for (const pos of possiblePositions) {
      if (maze[pos.y] && maze[pos.y][pos.x] === 0) {
        player = { x: pos.x, y: pos.y };
        break;
      }
    }
  
    // Vẽ lại mê cung với vị trí mới của nhân vật
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawMaze(ctx);
  };
  

  // Chơi lại
  const restartGame = () => {
    player = { x: 1, y: 1 }; // Reset vị trí nhân vật
    setMaze(generateMaze()); // Tạo mê cung mới khi chơi lại
    setShowConfetti(false); // Tắt confetti khi chơi lại
    setShowModal(false); // Ẩn modal khi chơi lại
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    drawMaze(ctx); // Vẽ lại mê cung mới
  };

  return (
    <div className="App">
      {showConfetti && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          className="confetti-canvas"
          numberOfPieces={1000}  // Thêm nhiều confetti
          gravity={0.2}         // Điều chỉnh trọng lực
          recycle={true}       // Không tái sử dụng confetti
          colors={['#ff3366', '#ff6699', '#ffcc00', '#ff1a4d']} // Màu sắc của confetti
        />
      )}
      
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>🎉 Chúc mừng! Bạn đã tìm thấy tình yêu đời mình rồi đó! 💖</h2>
            <div className="modal-buttons">
              <button onClick={closeModal}>Đóng</button>
              <button onClick={restartGame}>Chơi lại</button>
            </div>
          </div>
        </div>
      )}

      <h1>Happy Valentine 2025 💘</h1>
      <p>Chúc các cặp đôi luôn hạnh phúc nè ☺️</p>
      <p>Bạn nào còn FA thì chơi trò này để tìm thấy tình yêu đời mình nhé 😘</p>
      <p className="game-name">💕 Mê Cung Tình Yêu 💕</p>
      <p>Dùng các phím W,A,S,D hoặc phím mũi tên để điều khiển ❤️ tìm đến 💖!</p>
      <div id="game-container">
        <img className="gif-left" src="/cupid.gif" alt="Gif Left" /> 
        <canvas ref={canvasRef}></canvas>
        <img className="gif-right" src="/cupid.gif" alt="Gif Right" />
      </div>
    </div>
  );
};

export default App;
