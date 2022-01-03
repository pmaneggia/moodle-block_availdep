export const init = (content) => {
    window.paola = content;
    console.log(content);
    d3.select('svg').selectAll('circle').data(Object.keys(content)).enter().append('circle').attr('r', 10).attr('cx', () => Math.floor(Math.random() * 200)).attr('cy', () => Math.floor(Math.random() * 100))
    console.log('Nodes: ' + nodes(content));
    console.log('Edges: ');
    window.simulation = forceSimulation(nodes(content));
};

function nodes(dependencies) {
    return Object.keys(dependencies);
}

function edges(dependencies) {

}
