// JSON file : https://pomber.github.io/covid19/timeseries.json


function getDOM() {
    return {
        casNouveauxHierStat: document.getElementById('casNouveauxHierStat'),
        casGuerisHierStat: document.getElementById('casGuerisHierStat'),
        casMortsHierStat: document.getElementById('casMortsHierStat'),
        
        casNouveauxPeriodeStat: document.getElementById('casNouveauxPeriodeStat'),
        casGuerisPeriodeStat: document.getElementById('casGuerisPeriodeStat'),
        casMortsPeriodeStat: document.getElementById('casMortsPeriodeStat'),
        
        casNouveauxMondeStat: document.getElementById('casNouveauxMondeStat'),
        casGuerisMondeStat: document.getElementById('casGuerisMondeStat'),
        casGuerisMondePourcentage: document.getElementById('casGuerisMondePourcentage'),
        casMortsMondeStat: document.getElementById('casMortsMondeStat'),
        casMortsMondePourcentage: document.getElementById('casMortsMondePourcentage'),
    
        nbTotal: document.getElementById('valeurStatTotal'),
        valeurStatEnCours: document.getElementById('valeurStatEnCours'),
        valeurStatPourcEnCours: document.getElementById('valeurStatPourcEnCours'),
        valeurStatMorts: document.getElementById('valeurStatMorts'),
        valeurStatPourcMorts: document.getElementById('valeurStatPourcMorts'),
        valeurStatGueris: document.getElementById('valeurStatGueris'),
        valeurStatPourcGueris: document.getElementById('valeurStatPourcGueris'),

        message: document.getElementById('infoSelection'),
        graphique: document.getElementById('graphique'),
        bouton: document.getElementById('chercher'),
        paysListe: document.getElementById('choixPays'),
        dateSelection: document.getElementById('depuis')
    }
}





// //  *** ELEMENTS DU DOM ***
async function getDatas(){
    const proxy = "https://cors-anywhere.herokuapp.com/";
    const response = await fetch(`${proxy}https://pomber.github.io/covid19/timeseries.json`);
    const data = await response.json();
    return data;
}


// //  *** APP CONTROLLER ***
async function appController(){
    // Récup data de l'api et éléments du DOM 
    const apiData = await getDatas();
    const domEl = getDOM();
    

    // *** LISTE DES PAYS ***
    const listePays = [...Object.keys(apiData)];
    listePays.sort();
    listePays.forEach(pays => {
        let optionElt = document.createElement('option');
        optionElt.setAttribute('value', pays);
        optionElt.classList.add('optionElements');
        if(pays === "France"){
            optionElt.setAttribute('selected', true);
        }
        optionElt.textContent = pays;
        domEl.paysListe.appendChild(optionElt);
    });

    // Initialisation
    getSelectedDatas();
    
    // Récup les données mondiales : 
    getWorldDatas();

    // Actualisation au click
    domEl.bouton.addEventListener("click", getSelectedDatas);

    // Gérer les dates : 
    domEl.dateSelection.setAttribute("value", "2020-01-22");
    domEl.dateSelection.setAttribute("max", hier);
}




const getSelectedDatas = async () => {
    // Récup date et mettre les données pour ce pays < date dans le graph
    console.log("j'ai reçu un click");

    const datas = await getDatas();
    const domEl = getDOM();
    const pays = domEl.paysListe.value;
    const datasDuPays = Array.from(datas[pays]);

    // MAJ stats de hier :
    domEl.casNouveauxHierStat.textContent = calcXmoinsY(datasDuPays, "confirmed", 2, 1);
    domEl.casGuerisHierStat.textContent = calcXmoinsY(datasDuPays, "recovered", 2, 1);
    domEl.casMortsHierStat.textContent = calcXmoinsY(datasDuPays, "deaths", 2, 1);


    // Maj des dates (format) puis selection des datas selon la date de départ choisie :
    datasDuPays.map(data => {
        let dataDateSplit = data["date"].split('-');
        dataDateSplit = `${dataDateSplit[0]}-${miseAuBonFormatDate(parseInt(dataDateSplit[1]).toString())}-${miseAuBonFormatDate(parseInt(dataDateSplit[2]).toString())}`;
        data["date"] = dataDateSplit;
        return data;
    })
    const date =  domEl.dateSelection.value;
    const datasDuPaysSelection = datasDuPays.filter(data => {
        return data["date"] >= date;
    })


    // Récupération des données sous forme de Arrays 
    const daysDate = returnArrayFor(datasDuPaysSelection, "date");
    // (juste pour mise en forme formt JJ/MM dans graphique) :
    const daysDateShort = daysDate.map(date => dateShort(date));
    // Autres data mises à jour :
    const nbConfirmed = returnArrayFor(datasDuPaysSelection, "confirmed");
    const nbDeaths = returnArrayFor(datasDuPaysSelection, "deaths");
    const nbRecovered = returnArrayFor(datasDuPaysSelection, "recovered");
    const nbCurrentCases = (function() {
        let arrayNbCur = [];
        for(i = 0; i < datasDuPaysSelection.length; i++){
            const curCaseI = nbConfirmed[i] - nbDeaths[i] - nbRecovered[i];
            arrayNbCur.push(curCaseI);
        }
        return arrayNbCur;
    }());


    // MAJ stats sur la période sélectionnée: 
    domEl.casNouveauxPeriodeStat.textContent = calcXmoinsY(nbConfirmed, "", "start", 1);
    domEl.casGuerisPeriodeStat.textContent = calcXmoinsY(nbRecovered, "", "start", 1);
    domEl.casMortsPeriodeStat.textContent = calcXmoinsY(nbDeaths, "", "start", 1);


    // Objet qui contient toutes les valeurs.
    const donneesArrayRecup = {
        daysDate: daysDate,
        daysDateShort: daysDateShort,
        nbConfirmed: nbConfirmed,
        nbRecovered: nbRecovered,
        nbCurrentCases: nbCurrentCases,
        nbDeaths: nbDeaths
    }

    // Message de mise des valeurs par défaut si date invalide / selon date choisie
    if(date < domEl.dateSelection.getAttribute('min')){
        domEl.message.textContent = "Aucune donnée valable avant le 22/01/2020. La plage de données débutera à cette date.";
    } else {
        domEl.message.textContent = `Données pour le pays : ${pays}, à partir du ${dateSimpleComplete(date)}.`;
    }
    
    // MAJ des div contenant les valeurs + du graphique
    updateUI(donneesArrayRecup);

    return
}



// A FAIRE : données mondiales affichées par défaut au démarrage + bouton pour les réafficher
const getWorldDatas = async () => {

    const apiData= await getDatas();
    const listePays = [...Object.entries(apiData)]
    const domEl = getDOM();

    const sommeMondeContamines = sommeValeursMondePour(listePays, "confirmed");
    const sommeMondeGueries = sommeValeursMondePour(listePays, "recovered");
    const sommeMondeMorts = sommeValeursMondePour(listePays, "deaths");
    const pourcentageGuerision = ((sommeMondeGueries * 100) / sommeMondeContamines).toFixed(1);
    const pourcentageMort = ((sommeMondeMorts * 100) / sommeMondeContamines).toFixed(1);
    
    domEl.casNouveauxMondeStat.textContent = sommeMondeContamines;
    domEl.casGuerisMondeStat.textContent = sommeMondeGueries;
    domEl.casGuerisMondePourcentage.textContent = pourcentageGuerision;
    domEl.casMortsMondeStat.textContent = sommeMondeMorts;
    domEl.casMortsMondePourcentage.textContent = pourcentageMort;
};



function sommeValeursMondePour(array, parametre){
    const sommeArray = array.reduce((acc, cur) => {
        const arrayDeValeurPays = cur[1];
        return acc + arrayDeValeurPays[arrayDeValeurPays.length -1][parametre];
    }, 0)
    return sommeArray;
}



function updateUI(valeursEnArray){
    // Actualiser stats
    const domEl = getDOM();

    const nbTotal = returnLastItem(valeursEnArray, "nbConfirmed");
    domEl.nbTotal.textContent = nbTotal;

    const nbDeCas = returnLastItem(valeursEnArray, "nbCurrentCases");
    domEl.valeurStatEnCours.textContent = nbDeCas
    domEl.valeurStatPourcEnCours.textContent = calcPourcentage(nbTotal, nbDeCas);

    const nbMorts = returnLastItem(valeursEnArray, "nbDeaths");
    domEl.valeurStatMorts.textContent = nbMorts;
    domEl.valeurStatPourcMorts.textContent = calcPourcentage(nbTotal, nbMorts);


    const nbGueris = returnLastItem(valeursEnArray, "nbRecovered");
    domEl.valeurStatGueris.textContent = nbGueris;
    domEl.valeurStatPourcGueris.textContent = calcPourcentage(nbTotal, nbGueris);


    //Actualiser graphique
    actualiserGraph(valeursEnArray["daysDateShort"], valeursEnArray["nbConfirmed"], valeursEnArray["nbCurrentCases"], valeursEnArray["nbDeaths"], valeursEnArray["nbRecovered"]);


}




//  *** GESTION DATES ***

const getYesterdayDate = () => {
    const auj = new Date();
    const hier = new Date(auj - new Date(86400000));
    return `${hier.getFullYear()}-${miseAuBonFormatDate(hier.getMonth()+1)}-${miseAuBonFormatDate(hier.getDate())}`;
}

function miseAuBonFormatDate(val){
    return val < 10 ? `0${val}` : val;
}

const hier = getYesterdayDate();








// *** GRAPHIQUE ***
function actualiserGraph(days, totalArray, actuelsArray, mortsArray, guerisArray){
    // Graphique
    const graph = document.createElement('canvas');
    graph.setAttribute("id", "graphique");

    document.getElementById('graphiqueDiv').innerHTML = "";
    document.getElementById('graphiqueDiv').appendChild(graph);


    const ctx = document.getElementById('graphique').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Total',
                data: totalArray,
                borderColor: [
                    '#83599b'
                ],
                borderWidth: 2,
                fill: false,
                pointBackgroundColor: '#83599b'
            },
            {
                label: 'Actuels',
                data: actuelsArray,
                borderColor: [
                    '#ffbd69'
                ],
                borderWidth: 2,
                fill: false,
                pointBackgroundColor: '#ffbd69'
            },
            {
                label: 'Décès',
                data: mortsArray,
                borderColor: [
                    '#ff6363'
                ],
                borderWidth: 2,
                fill: false,
                pointBackgroundColor: '#ff6363'
            },
            {
                label: 'Guéris',
                data: guerisArray,
                borderColor: [
                    '#8BC34A'
                ],
                borderWidth: 2,
                fill: false,
                pointBackgroundColor: '#8BC34A'
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    gridLines: {
                        color: "#111111",
                        lineWidth: 0.5
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    },
                    gridLines: {
                        color: "#111111",
                        lineWidth: 0.5
                    } 
                }]
            },
            titles: {
                fontColor: "#f9f9f9"
            },
            legend: {
                labels: {
                    fontColor: "#f9f9f9"
                }
            },
            tooltips:{
                backgroundColor: "#f9f9f9",
                bodyFontColor: "#212121",
                titleFontColor: "#212121"
            }
        }
    });
}
    




// Formatage de données
function dateSimpleComplete(date){
    let dateSplit = date.split('-');
    let jour = dateSplit[2];
    let mois = dateSplit[1];
    let annee = dateSplit[0];
    let moisListe = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

    return `${jour} ${moisListe[parseInt(mois)]} ${annee}`;
}

function dateShort(date){
    let dateSplit = date.split('-');
    let jour = dateSplit[2];
    let mois = parseInt(dateSplit[1]);
    if(mois < 10) {
        mois = `0${mois}`;
    }

    return `${jour}/${mois}`;
}

function returnLastItem(arrayGlobal, parametre){
    return arrayGlobal[parametre][arrayGlobal[parametre].length - 1];
}

function calcPourcentage(total, nb){
    let pourcentage = (nb * 100) / total;
    return `${pourcentage.toFixed(1)}%`;
}

function calcXmoinsY(arrayGlobal, parametre, premierIndex, dernierIndex){
    if (premierIndex === "start") premierIndex = arrayGlobal.length;

    if(parametre){
        return arrayGlobal[arrayGlobal.length - dernierIndex][parametre] - arrayGlobal[arrayGlobal.length - premierIndex][parametre];
    } else {
        return arrayGlobal[arrayGlobal.length - dernierIndex] - arrayGlobal[arrayGlobal.length - premierIndex];
    }
    
}


function returnArrayFor(paysToutesDonnees, paysValue){
    var arrayPays = [];

    paysToutesDonnees.forEach(data => {
        arrayPays.push(data[paysValue]);
    })
    return arrayPays;
}

// *** LANCEMENT APPLI ***
appController();