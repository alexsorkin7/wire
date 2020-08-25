<?php

namespace als\Wire\Console;

use Illuminate\Console\Command;

class WireController extends Command {

    protected $signature = 'make:wireController {name}';
    protected $description = 'Makes Wire controller';

    public function handle() {
        self::makeController();
        self::makeRoute();
    }

    private function makeRoute() {
        $route = fopen('routes/web.php', "a") or die("Unable to open file!");
        $txt = "Route::resource('".lcfirst(str_replace('Controller','',$this->argument('name')))."','".$this->argument('name')."');\n";
        fwrite($route, $txt);
        fclose($route);
    }

    private function makeController() {
        $newController = fopen('app/Http/Controllers/'.$this->argument('name').'.php', "w") or die("Unable to open file!");
        $txt = '<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Als\Wire\WireController;


class '.$this->argument('name').' extends WireController
{
    public $tables = [];
    public $auth = true;

}
        ';
        fwrite($newController, $txt);
        fclose($newController);
    }


}
