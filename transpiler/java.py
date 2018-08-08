from random import random
import subprocess
import os
from time import sleep
import math
import shutil
import sys

java_js_postfix = """
var robot = {'robot':new robot.MyRobot()};
"""

WORKSPACE = "java/workspace"

def compile(source):
    p = None
    id = math.floor(random()*1000000)
    dir = WORKSPACE + "/" + str(id)

    # Set up working directory, and copy files.
    if not os.path.exists(WORKSPACE):
        os.makedirs(WORKSPACE)

    if not os.path.exists(dir):
        os.makedirs(dir)

    shutil.copyfile("java/pom.xml", dir + "/pom.xml")
    shutil.copytree("java/src", dir + "/src")

    # Write source to working directory.
    with open(dir + "/src/main/java/MyRobot.java", mode="w") as f:
        f.write(source)

    # Launch compiler.
    p = subprocess.Popen(['mvn', 'generate-sources'],
                     cwd=dir,
                     stdout=subprocess.PIPE,
                     stderr=subprocess.PIPE)

    # Wait for compiler to finish.
    p.wait()

    # Read stdout from compiler.
    stdout, stderr = p.communicate()

    print("stdout:", len(stdout), file=sys.stderr)
    print("stderr:", len(stderr), file=sys.stderr)
    # Odd bug fix.  Required for docker workiness.
    o = stdout.decode("utf-8")
    if o.rstrip() == "":
        o = stderr.decode("utf-8")
    print("o:", o, file=sys.stderr)

    errors = ""
    last_error = False


    # Parse compiler stdout for errors.
    for line in o.split("\n"):
        args = line.split(" ")

        if line[0:4] == '2018' and args[2] == 'ERROR' and args[3] == 'JSweetTranspiler:83':
            last_error = True

            path = os.getcwd()+"/java/src/main/java/"
            l = " ".join(args[5:]).replace(path, "")

            errors += l + "\n"
        else:
            if last_error and not line[0] in ["2", ">", "["]:
                errors += line + "\n"
            else:
                last_error = False

    success =  "[INFO] BUILD SUCCESS" in o.split("\n")[-7:-5]

    js = ''
    source_map = ''

    # Read generates js and sourcemap.
    if success:
        with open(dir + "/target/bundle.js") as f:
            js = f.read()

        with open(dir + "/target/bundle.js.map") as f:
            source_map = f.read()

    # Cleanup working dir.
    shutil.rmtree(dir)

    if success:
        js += java_js_postfix

    return {'success':success, 'error':errors, 'js':js, 'map':source_map}


example = """
package robot;

public class MyRobot extends BCAbstractRobot {
    public Action turn() {
        return move(0);
    }
}
"""
{"lang":"js","source":"package robot; public class MyRobot extends BCAbstractRobot { public Action turn() { return move(0); } } "}


