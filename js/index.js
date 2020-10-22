var login = window.localStorage.getItem('login');
if(!login) {
    login = prompt('Informe o login');
    window.localStorage.setItem('login', login);
}


var senha = window.localStorage.getItem('senha');
if(!senha) {
    senha = prompt('Informe a senha');
    window.localStorage.setItem('senha', senha);
}

var app = angular.module('app', []);
var baseUrl = "https://appc.com21.com.br/web/api";

app.controller('despesas-controller', ['$scope','$http', function($scope, $http) {

    $scope.loginResult = {};
    $scope.contratos = {};
    $scope.proprietarios = localStorage.getItem('proprietarios') ? JSON.parse(localStorage.getItem('proprietarios')) : [];
    $scope.liberacoes = localStorage.getItem('liberacoes') ? JSON.parse(localStorage.getItem('liberacoes')) : [];
    $scope.textoPesquisa = "";

	$scope.getToken = function() {
		$http.post(baseUrl + '/login', {"login":login ,"senha":senha,"identificador":0})
		.success(function(data, status, headers, config) {
			$scope.loginResult = data;
			$scope.getContratos();
		})
		.error(function(data, status, headers, config) {
		    alert("Erro ao obter tocken: " + data.message);
		});
	}

	$scope.getContratos = function() {
		$http.get(
			baseUrl + '/rest/clientes/249/empresas/75531/contratos?pagina=1&registrosPorPagina=1000&totalRegistros=true',
			{headers: $scope.getHeader()}
		)
		.success(function(contratos, status, headers, config) {
			$scope.contratos = {};

			contratos.forEach(function (contrato) {
                $scope.contratos[contrato.idContrato] = contrato.nomeSegmento + ' ' + contrato.objeto;
            });

			$scope.getProprietarios();
		})
		.error(function(data, status, headers, config) {
		    alert("Erro ao obter contatos: " + data.message);
		});
	}

	$scope.getProprietarios = function() {
		$http.get(
			baseUrl + '/rest/adm/clientes/249/empresas/75531/pessoas?detalhesUsuarioAssociado=true&ordem=nome&pagina=1&registrosPorPagina=10000&tipoPessoa=morador&totalRegistros=true',
			{headers: $scope.getHeader()}
		)
		.success(function(proprietarios, status, headers, config) {
			var proprietariosTable = [];

			proprietarios.forEach(function (proprietario) {
				var contratos = {};
                proprietario.contratos.forEach(function (contrato) {
					contratos[contrato.idContrato] = contrato.idContrato;
                });

                for(idContrato in contratos) {
                	proprietariosTable.push({nome: proprietario.nome + (proprietario.sobrenome ? (" " +proprietario.sobrenome) : ''), lote: $scope.contratos[idContrato], detalhes: proprietario});	
                }
            });

            proprietariosTable.sort($scope.sort);            

            localStorage.setItem('proprietarios', JSON.stringify(proprietariosTable));
			$scope.proprietarios = proprietariosTable;

            $scope.getLiberacaoAcesso();
		})
		.error(function(data, status, headers, config) {
		    alert("Erro ao obter proprietarios: " + data.message);
		});
	}

	$scope.getLiberacaoAcesso = function() {
		$http.get(
			baseUrl + '/rest/clientes/249/empresas/75531/liberacaoAcesso?pagina=1&registrosPorPagina=10000',
			{headers: $scope.getHeader()}
		)
		.success(function(liberacoes, status, headers, config) {
			var liberacoesTable = [];

            liberacoes.forEach(function (liberacao) {
				liberacoesTable.push({nome: liberacao.nomeVisitante + (liberacao.sobrenomeVisitante ? (" " + liberacao.sobrenomeVisitante) : "" ), lote: (liberacao.segmentoContrato + ' ' + liberacao.objetoContrato), detalhes: liberacao});	
            });

            liberacoesTable.sort($scope.sort);

            localStorage.setItem('liberacoes', JSON.stringify(liberacoesTable));
			$scope.liberacoes = liberacoesTable;
		})
		.error(function(data, status, headers, config) {
		    alert("Erro ao obter LiberacaoAcesso: " + data.message);
		});
	}

	$scope.detalhesProprietario = function(item) {
		alert("Lote: " + item.lote + 
			  "\nNome: "+ item.nome +  
			  "\nDocumento: "+ $scope.mask(item.detalhes.numeroDocumento) + 
			  "\nTelefone: " + item.detalhes.celular + " " + item.detalhes.telefone+ 
			  "\nEmail: " + item.detalhes.email);
	}

	$scope.detalhesAutorizado = function(item) {
		alert("Lote: " + item.lote + 
			  "\nNome: "+ item.nome +  
			  "\nDocumento: "+ $scope.mask(item.detalhes.documentoVisitante) + 
			  "\nPlaca: " + (item.detalhes.placa||"") + 
			  "\nInício: " + new Date(item.detalhes.dataInicioLiberacao).toLocaleDateString() + 
			  "\nFim: " + new Date(item.detalhes.dataFimLiberacao).toLocaleDateString());
	}

	$scope.mask = function(valor) {
		if(!valor || valor.length < 8) {
			return "";
		}
		var first4 = valor.substring(0, 4);
		var last5 = valor.substring(valor.length - 4);

		mask = valor.substring(4, valor.length - 4).replace(/\d/g,"*");
		return first4 + mask + last5;
	}

	$scope.getHeader = function() {
		return {
	    	'Authorization': $scope.loginResult.token,
			'ClientCode': 9169,
			'IdEmpresa': 75531,
			'IdentificadorAplicacao': 0,
			'IdPapel': 0,
			'ProdutoTipo': 1,
			'Role': 'AdministradorCondominio',
			'Username': $scope.loginResult.id			    	
	    };	
	}

	$scope.sort = function(a, b) {
		if ( a.lote < b.lote ){
			return -1;
		}
		if ( a.lote > b.lote ){
			return 1;
		}
		if ( a.tipo < b.tipo ){
			return -1;
		}
		if ( a.tipo > b.tipo ){
			return 1;
		}
		if ( a.nome < b.nome ){
			return -1;
		}
		if ( a.nome > b.nome ){
			return 1;
		}				
		return 0;                	
    }

    $scope.getToken();
}]);

setInterval(function() {
	angular.element(document.getElementById("controller")).scope().getToken();
}, 1000*60*10);
