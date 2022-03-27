#!/bin/bash

cd "$(dirname "$0")"
cd ..

sig_handler() {
  exit_status=$?
  kill -9 "$child" 2>/dev/null
  exit "$exit_status"
}
trap sig_handler INT HUP TERM QUIT

if [[ $@ = 'clean' ]]; then
  . ./bin/commands/clean.sh
elif [[ $@ = 'dev' ]]; then
  . ./bin/commands/dev.sh
elif [[ $@ = 'install' ]]; then
  . ./bin/commands/install.sh
elif [[ $@ = 'lint' ]]; then
  . ./bin/commands/lint.sh
elif [[ $@ = 'ncu' ]]; then
  . ./bin/commands/ncu.sh
  exit
elif [[ $@ = 'upgrade' ]]; then
  . ./bin/commands/upgrade.sh
elif [[ $1 = 'prune' ]]; then
  . ./bin/commands/prune.sh
elif [[ $1 = 'workspace' ]]; then
  . ./bin/commands/workspace.sh
elif [[ $1 = 'help' ]]; then
  echo "Usage: terry [command]"
  echo "Commands:"
  echo ""
  echo "  terry clean                               Remove build files"
  echo ""
  echo "  terry dev [services]                      Run local development build for specified services"
  echo "    Examples:"
  echo "      terry dev"
  echo "      terry dev client server postgres caddy"
  echo "      terry dev -d"
  echo ""
  echo "  terry install                             Install all packages"
  echo "  terry lint                                Run ESLint and tsc --noEmit on all services"
  echo "  terry ncu                                 Check upgradable yarn dependencies"
  echo "  terry prune                               Prune stopped docker containers"
  echo "              --all                         Prune all docker data"
  echo "  terry upgrade                             Upgrade all packages"
  echo ""
  echo "  terry workspace [workspace] [command]     Run yarn command on workspace"
  echo "    Examples:"
  echo "      terry workspace client add axios"
  echo "      terry workspace server lint"
  echo ""
  exit

# Failed to find command
else
  $0 help
  exit
fi

echo "⏲  Done in $((($SECONDS / 60) % 60))min $(($SECONDS % 60))sec"
