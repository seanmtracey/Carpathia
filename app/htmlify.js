
const styles = `
body{
	width: 1280px;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    align-items: center;
    justify-content: center;
	font-family: sans-serif;
	background: #489c72;
	flex-wrap: wrap;
}

.vine{
    width: 500px;
    display: flex;
    max-height: 200px;
    background: white;
    padding: 1em;
    border-radius: 5px;
	margin: 1em;
}

.vine video{
	width: 200px;
}

.vine .data{
	margin-left: 1em;
}

.vine .data .datum h4{
	margin: 0;
}

`;

const playScript = `

	document.querySelectorAll('video').forEach(video => {
		video.addEventListener('click', function(){
			if(video.paused){
				video.currentTime = 0;
				video.play();
			} else {
				video.pause();
			}
		});
	});
`;

const tops = `<!DOCTYPE html><html><head><style>${styles}</style></head><body>`;
let body = ``;
const tails = `</body><script>${playScript}</script></html>`

function addToBody(item){

	const html = `
	<div class="vine">
		<video src="/${item.created}.mp4" loop></video>
		<div class="data">
			<div class="datum">
				<h4>Description:</h4><p>${item.description}</p>
			</div>
			<div class="datum">
				<h4>Created:</h4><p>${item.created}</p>
			</div>
		</div>
	</div>`;
	body += html;

}

function generateHTML(){

	return `${tops}${body}${tails}`;

}

module.exports = {
	add : addToBody,
	output : generateHTML
};