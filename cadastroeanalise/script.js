function iniciarCadastro() {
    let qtdAlunos;
    do {
        qtdAlunos = parseInt(prompt("Quantos alunos deseja cadastrar?"));
    } while (isNaN(qtdAlunos) || qtdAlunos <= 0);

    let resultadoFinal = "";

    for (let i = 0; i < qtdAlunos; i++) {
        let nome, nota1, nota2;

        do {
            nome = prompt(`Informe o nome do aluno ${i + 1}:`);
        } while (!nome);

        do {
            nota1 = parseFloat(prompt(`Informe a nota 1 de ${nome}:`));
        } while (isNaN(nota1) || nota1 < 0 || nota1 > 10);

        do {
            nota2 = parseFloat(prompt(`Informe a nota 2 de ${nome}:`));
        } while (isNaN(nota2) || nota2 < 0 || nota2 > 10);

        const media = calcularMedia(nota1, nota2);
        const status = media >= 6 ? "Aprovado" : "Reprovado";

        resultadoFinal += `<p><strong>Aluno:</strong> ${nome} | <strong>Média:</strong> ${media.toFixed(2)} | <strong>Situação:</strong> ${status}</p>`;
    }

    document.getElementById("resultado").innerHTML = resultadoFinal;
}

function calcularMedia(n1, n2) {
    return (n1 + n2) / 2;
}
