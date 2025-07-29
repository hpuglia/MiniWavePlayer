!macro customInstall
  ; Fecha instância antiga, se estiver rodando
  nsExec::ExecToStack 'taskkill /F /IM MiniWavePlayer.exe /T'

  ; Caminho padrão da instalação anterior
  ReadRegStr $R0 HKCU "Software\MiniWavePlayer" "UninstallPath"
  StrCmp $R0 "" doneUninstall

  ; Executa desinstalador anterior silenciosamente, se existir
  IfFileExists "$R0" 0 doneUninstall
  ExecWait '"$R0" /SILENT' ; Remove versão anterior sem perguntar

doneUninstall:
!macroend

!macro customUnInstall
  ; Fecha instância antiga
  nsExec::ExecToStack 'taskkill /F /IM MiniWavePlayer.exe /T'
!macroend

!macro customFinish
  MessageBox MB_OK "Instalação do MiniWavePlayer concluída com sucesso!"
!macroend
