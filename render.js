export function drawSnake(ctx, snakeBody) {
    ctx.fillStyle = '#4CAF50';
    snakeBody.forEach(segment => {
        ctx.fillRect(segment.x * 20, segment.y * 20, 18, 18);
    });
}
