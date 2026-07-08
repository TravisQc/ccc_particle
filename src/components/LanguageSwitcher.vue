<script setup lang="ts">
import { computed } from "vue";
import { NIcon, NSelect } from "naive-ui";
import { Languages } from "@lucide/vue";
import { useI18n } from "vue-i18n";
import { defaultLocale, isSupportedLocale, localeLabelKeys, setLocale, supportedLocales, type SupportedLocale } from "../i18n";
import type { SelectOption } from "./fields/SelectField.vue";

const { locale, t } = useI18n();

const selectedLocale = computed<SupportedLocale>({
  get: () => (isSupportedLocale(locale.value) ? locale.value : defaultLocale),
  set: (value) => setLocale(value),
});

const localeOptions = computed<SelectOption[]>(() =>
  supportedLocales.map((value) => ({
    value,
    label: t(localeLabelKeys[value]),
  })),
);
</script>

<template>
  <div class="language-switcher">
    <NIcon class="language-switcher-icon" :component="Languages" />
    <NSelect
      v-model:value="selectedLocale"
      :aria-label="t('language.selectAria')"
      :consistent-menu-width="false"
      :options="localeOptions"
      size="small"
    />
  </div>
</template>
