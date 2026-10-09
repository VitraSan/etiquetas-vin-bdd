'use strict';

// Os mesmos cenários rodam em duas camadas:
//   dominio -> passos chamam as regras de negócio direto (rápido, isola a lógica)
//   api     -> passos fazem requisições HTTP na API Express (valida status e contrato JSON)
const base = {
  paths: ['features/**/*.feature'],
  require: ['features/support/**/*.js', 'features/step_definitions/**/*.js'],
  strict: true,
};

const perfil = (driver) => ({
  ...base,
  worldParameters: { driver },
  format: [
    'progress-bar',
    `html:reports/${driver}.html`,
    `junit:reports/${driver}.xml`,
    `summary`,
  ],
});

module.exports = {
  default: perfil('dominio'),
  dominio: perfil('dominio'),
  api: perfil('api'),
};
