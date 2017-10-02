define([
	"@steal",
	"@loader",
	"module",
	"./template",
	"./parse",
	"steal-stache/add-bundles",
	"can-util/js/each/each"
], function(steal, loader, module, template, parse, addBundles, each){
	return function init(useZones){
		var main;

		var isNode = typeof process === "object" &&
			{}.toString.call(process) === "[object process]";

		if(!isNode) {
			steal.done().then(setup);
		}

		function setup(){
			loader.import(loader.main).then(function(r){
				main = r;
				liveReload();
			});
		}

		function liveReload(){
			if(!loader.liveReloadInstalled) {
				return;
			}

			loader.import("live-reload", { name: module.id }).then(function(reload){
				loader.normalize(loader.main).then(function(mainName){
					reload(function(){
						document.documentElement.removeAttribute("data-attached");
						main.renderAndAttach();
					});

					reload(mainName, function(r){
						main = r;
					});
				});
			});
		}

		function map(obj, cb){
			var out = [];
			each(obj, function(a, b){
				out.push(cb(a, b));
			});
			return out;
		}

		function translate(load){
			var result = parse(load.source, this, useZones);

			return Promise.all([
				addBundles(result.dynamicImports, load.name),
				Promise.all(result.imports)
			]).then(function(pResults){
				var output = template({
					imports: JSON.stringify(pResults[1]),
					args: result.args.join(", "),
					useZones: useZones,
					intermediate: JSON.stringify(result.intermediate),
					ases: map(result.ases, function(from, name){
						return "\t" + name + ": " + name +"['default'] || " + name;
					}).join(",\n")
				});

				return output;
			});
		}

		return {
			translate: translate
		};
	}
});
