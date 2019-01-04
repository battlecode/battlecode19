from random import random
import subprocess
import os
from time import sleep
import math
import shutil
import re

WORKSPACE = "python_workspace"

def compile(sources, min=True):
    p = None
    id = math.floor(random()*1000000)
    dir = WORKSPACE + "/" + str(id)

    # Set up working directory, and copy files.
    if not os.path.exists(WORKSPACE):
        os.makedirs(WORKSPACE)

    if not os.path.exists(dir):
        os.makedirs(dir)

    has_robot = False
    for source in sources:
        if source['filename'] == 'robot.py':
            has_robot = True

    if not has_robot:
        return {'success':False, 'error':"No robot.py provided.", 'js':"", 'map':""}

    for source in sources:
        if len(source['filename']) > 20 or not re.match(r'^[A-Za-z0-9_.]+$', source['filename']) or source['filename'].count('.') != 1 or not source['filename'].endswith('.py'):
            continue
        
        # Write sources to working directory.
        with open(dir + "/" + source['filename'], mode="w") as f:
            f.write(source['source'])


    # Launch compiler.
    p = subprocess.Popen(['python3', '-m', 'transcrypt', 
                     '-m', '-b', '-p', '.none', 'robot'],
                     cwd=dir,
                     stdout=subprocess.PIPE,
                     stderr=subprocess.STDOUT)

    # Wait for compiler to finish.
    p.wait()

    # Read stdout from compiler.
    o = p.communicate()[0].decode("utf-8")  
    
    success = False
    errors = ""
    js = ""
    source_map = ""

    if o.split("\n")[-3] == "Ready":
        success = True

        if min:
            with open(dir + "/__javascript__/robot.min.js") as f:
                js = f.read()

            with open(dir + "/__javascript__/extra/sourcemap/robot.min.js.map") as f:
                source_map = f.read()
        else:
            with open(dir + "/__javascript__/robot.js") as f:
                js = f.read()

            with open(dir + "/__javascript__/extra/sourcemap/robot.js.map") as f:
                source_map = f.read()


    else:
        path = os.getcwd() + "/" + dir + "/"
        errors = "\n".join(o.split("\n")[5:-3]).replace(path,"")

    # Cleanup working file.
    shutil.rmtree(dir)

    return {'success':success, 'error':errors, 'js':js, 'map':source_map}
