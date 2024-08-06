# -*- mode: python ; coding: utf-8 -*-
import pyiqa
from PyInstaller.utils.hooks import collect_data_files, collect_submodules
pyiqa_path = os.path.dirname(pyiqa.__file__)
clip_datas = collect_data_files('clip')
timm_datas = collect_data_files('timm')
timm_submodules = collect_submodules('timm')
imgaug_datas = collect_data_files('imgaug')
facexlib_datas = collect_data_files('facexlib')


a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[
    (pyiqa_path, 'pyiqa'),
    *clip_datas,
    *timm_datas,
    *imgaug_datas,
    *facexlib_datas,
    ],
    hiddenimports=['pyiqa', 'torch', 'cv2', 'flask', 'flask_cors', 'clip', 'timm', 'timm.models', 'timm.models.layers', *timm_submodules, 'imgaug', 'facexlib'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='IQA',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None
)

